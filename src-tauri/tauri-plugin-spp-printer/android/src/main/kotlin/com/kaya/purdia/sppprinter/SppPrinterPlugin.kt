package com.kaya.purdia.sppprinter

import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothSocket
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.IOException
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

private const val TAG = "SppPrinterPlugin"

// Direct Kotlin port of apps/pos-web/android/.../SppPrinterPlugin.java
// (a Capacitor plugin) to Tauri's plugin shape — same SPP UUID, same
// daemon-thread-with-10s-cap connect strategy, same per-address socket map.
private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

@InvokeArg
class AddressArgs {
    lateinit var address: String
}

@InvokeArg
class WriteArgs {
    lateinit var address: String
    var data: List<Int> = emptyList()
}

@TauriPlugin
class SppPrinterPlugin(private val activity: Activity) : Plugin(activity) {

    private val sockets = ConcurrentHashMap<String, BluetoothSocket>()

    /** List all paired (bonded) Bluetooth devices. */
    @Command
    fun listPaired(invoke: Invoke) {
        val adapter = BluetoothAdapter.getDefaultAdapter()
        if (adapter == null) {
            invoke.reject("Bluetooth not supported")
            return
        }
        val devices = JSArray()
        try {
            for (d in adapter.bondedDevices) {
                Log.d(TAG, "listPaired: bonded device ${d.name} (${d.address}) bondState=${d.bondState} type=${d.type}")
                val obj = JSObject()
                obj.put("address", d.address)
                obj.put("name", d.name ?: d.address)
                devices.put(obj)
            }
        } catch (e: SecurityException) {
            invoke.reject(
                "Bluetooth permission not granted — enable it in Settings > Apps > " +
                    "Purdia POS > Permissions"
            )
            return
        }
        val result = JSObject()
        result.put("devices", devices)
        invoke.resolve(result)
    }

    /** Open an SPP socket to a paired device by MAC address. */
    @Command
    fun connect(invoke: Invoke) {
        val args = invoke.parseArgs(AddressArgs::class.java)
        Log.d(TAG, "connect: address=${args.address}")

        val adapter = BluetoothAdapter.getDefaultAdapter()
        if (adapter == null) {
            Log.e(TAG, "connect: no BluetoothAdapter (device has no Bluetooth?)")
            invoke.reject("Bluetooth not supported")
            return
        }
        Log.d(TAG, "connect: adapter.isEnabled=${adapter.isEnabled}")

        val socket: BluetoothSocket
        try {
            val device = adapter.getRemoteDevice(args.address)
            Log.d(TAG, "connect: resolved device bondState=${device.bondState} type=${device.type}")
            socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
            // Not calling adapter.cancelDiscovery() here: it requires the
            // separate BLUETOOTH_SCAN runtime permission (distinct from
            // BLUETOOTH_CONNECT, which the rest of this flow uses), and
            // isn't essential for connecting to an already-bonded device —
            // skipping it avoids needing a second runtime permission
            // request flow for a non-essential call.
        } catch (e: SecurityException) {
            Log.e(TAG, "connect: SecurityException creating socket", e)
            invoke.reject(
                "Bluetooth permission not granted — enable it in Settings > Apps > " +
                    "Purdia POS > Permissions"
            )
            return
        } catch (e: IOException) {
            Log.e(TAG, "connect: socket creation failed", e)
            invoke.reject("SPP socket creation failed: ${e.message}")
            return
        }

        // Run blocking connect() on a daemon thread with a 10s hard cap so the
        // JS await never hangs longer than that when the device is out of range.
        var connectError: IOException? = null
        val connectThread = Thread {
            try {
                socket.connect()
                Log.d(TAG, "connect: socket.connect() returned, isConnected=${socket.isConnected}")
            } catch (e: IOException) {
                connectError = e
                Log.e(TAG, "connect: socket.connect() threw", e)
            }
        }
        connectThread.isDaemon = true
        connectThread.start()
        try {
            connectThread.join(10_000)
        } catch (e: InterruptedException) {
            Thread.currentThread().interrupt()
        }

        if (connectThread.isAlive) {
            Log.e(TAG, "connect: timed out after 10s (still alive)")
            try { socket.close() } catch (ignored: IOException) {}
            invoke.reject("SPP connect timed out")
            return
        }
        if (!socket.isConnected) {
            Log.e(TAG, "connect: not connected after thread finished, error=${connectError?.message}")
            try { socket.close() } catch (ignored: IOException) {}
            invoke.reject("SPP connect failed: ${connectError?.message ?: "unknown"}")
            return
        }

        // Close any existing socket for this address before storing the new one.
        val old = sockets.put(args.address, socket)
        old?.let { try { it.close() } catch (ignored: IOException) {} }

        Log.d(TAG, "connect: success")
        invoke.resolve()
    }

    /** Write raw bytes to a connected SPP device. */
    @Command
    fun write(invoke: Invoke) {
        val args = invoke.parseArgs(WriteArgs::class.java)
        Log.d(TAG, "write: address=${args.address} bytes=${args.data.size}")
        val socket = sockets[args.address]
        if (socket == null || !socket.isConnected) {
            Log.e(TAG, "write: not connected (socket=${socket}, isConnected=${socket?.isConnected})")
            invoke.reject("Not connected to ${args.address}")
            return
        }
        try {
            val bytes = ByteArray(args.data.size) { i -> args.data[i].toByte() }
            val out = socket.outputStream
            out.write(bytes)
            out.flush()
            Log.d(TAG, "write: success, wrote ${bytes.size} bytes")
            invoke.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "write: failed", e)
            invoke.reject("SPP write failed: ${e.message}")
        }
    }

    /** Close the SPP socket for a device. */
    @Command
    fun disconnect(invoke: Invoke) {
        val args = invoke.parseArgs(AddressArgs::class.java)
        Log.d(TAG, "disconnect: address=${args.address}")
        val socket = sockets.remove(args.address)
        socket?.let { try { it.close() } catch (ignored: IOException) {} }
        invoke.resolve()
    }
}
