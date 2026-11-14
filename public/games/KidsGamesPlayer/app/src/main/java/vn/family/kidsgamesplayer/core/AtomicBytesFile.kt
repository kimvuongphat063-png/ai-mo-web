package vn.family.kidsgamesplayer.core

import androidx.core.util.AtomicFile
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * Whole-file atomic replace. The app uses [AndroidAtomicBytesFile] (androidx AtomicFile, as
 * the bible requires). JVM unit tests on a Windows build host use [NioAtomicBytesFile],
 * because AtomicFile relies on rename-over-existing, which Linux/Android allows and
 * Windows does not. AtomicFile itself is exercised by instrumentation tests on Android.
 */
interface AtomicBytesFile {
    val file: File
    fun exists(): Boolean

    @Throws(IOException::class)
    fun read(): ByteArray

    @Throws(IOException::class)
    fun write(bytes: ByteArray)

    fun interface Factory {
        fun create(file: File): AtomicBytesFile
    }
}

class AndroidAtomicBytesFile(override val file: File) : AtomicBytesFile {
    private val atomic = AtomicFile(file)

    override fun exists(): Boolean = file.exists() || File(file.path + ".bak").exists()

    override fun read(): ByteArray = atomic.readFully()

    override fun write(bytes: ByteArray) {
        file.parentFile?.mkdirs()
        val out = atomic.startWrite()
        try {
            out.write(bytes)
            atomic.finishWrite(out)
        } catch (e: IOException) {
            atomic.failWrite(out)
            throw e
        }
    }

    companion object {
        val FACTORY = AtomicBytesFile.Factory { AndroidAtomicBytesFile(it) }
    }
}

class NioAtomicBytesFile(override val file: File) : AtomicBytesFile {
    override fun exists(): Boolean = file.exists()

    override fun read(): ByteArray = file.readBytes()

    override fun write(bytes: ByteArray) {
        file.parentFile?.mkdirs()
        val tmp = File(file.path + ".new")
        FileOutputStream(tmp).use { out ->
            out.write(bytes)
            out.fd.sync()
        }
        Files.move(tmp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
    }

    companion object {
        val FACTORY = AtomicBytesFile.Factory { NioAtomicBytesFile(it) }
    }
}
