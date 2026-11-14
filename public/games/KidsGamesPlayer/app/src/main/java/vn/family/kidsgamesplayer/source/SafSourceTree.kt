package vn.family.kidsgamesplayer.source

import android.content.ContentResolver
import android.net.Uri
import android.provider.DocumentsContract
import java.io.FileNotFoundException
import java.io.IOException
import java.io.InputStream
import vn.family.kidsgamesplayer.core.ErrorCodes

/**
 * SAF tree access through ContentResolver + DocumentsContract. Never converts content://
 * to a filesystem path. All calls block and must run on an IO dispatcher.
 */
class SafSourceRoot(
    private val resolver: ContentResolver,
    private val treeUri: Uri,
) : SourceRoot {
    override val rootId: String get() = treeUri.toString()
    override val isBuiltin: Boolean get() = false

    override fun listGameFolders(): List<SourceNode> {
        val rootDocId = try {
            DocumentsContract.getTreeDocumentId(treeUri)
        } catch (e: IllegalArgumentException) {
            throw SourceAccessException(ErrorCodes.PROVIDER_ERROR, "bad tree uri", e)
        }
        return SafNode(resolver, treeUri, rootDocId, "", true, -1, 0).children().filter { it.isDirectory }
    }
}

internal class SafNode(
    private val resolver: ContentResolver,
    private val treeUri: Uri,
    private val documentId: String,
    override val name: String,
    override val isDirectory: Boolean,
    override val declaredSize: Long,
    override val lastModified: Long,
) : SourceNode {
    override val location: String
        get() = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId).toString()

    override fun children(): List<SourceNode> {
        if (!isDirectory) throw IOException("not a directory")
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, documentId)
        val projection = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_SIZE,
            DocumentsContract.Document.COLUMN_LAST_MODIFIED,
        )
        val out = ArrayList<SourceNode>()
        try {
            val cursor = resolver.query(childrenUri, projection, null, null, null)
                ?: throw SourceAccessException(ErrorCodes.PROVIDER_ERROR, "provider returned no cursor")
            cursor.use { c ->
                while (c.moveToNext()) {
                    val id = c.getString(0) ?: continue
                    val displayName = c.getString(1) ?: continue
                    val mime = c.getString(2)
                    val size = if (c.isNull(3)) -1L else c.getLong(3)
                    val modified = if (c.isNull(4)) 0L else c.getLong(4)
                    out += SafNode(
                        resolver, treeUri, id, displayName,
                        mime == DocumentsContract.Document.MIME_TYPE_DIR, size, modified,
                    )
                    if (out.size > MAX_CHILDREN) break
                }
            }
        } catch (e: SecurityException) {
            throw SourceAccessException(ErrorCodes.PERMISSION_LOST, "permission denied", e)
        } catch (e: SourceAccessException) {
            throw e
        } catch (e: IllegalArgumentException) {
            throw SourceAccessException(ErrorCodes.PROVIDER_ERROR, "provider rejected query", e)
        } catch (e: RuntimeException) {
            throw SourceAccessException(ErrorCodes.PROVIDER_ERROR, e.javaClass.simpleName, e)
        }
        return out.sortedBy { it.name }
    }

    override fun openStream(): InputStream {
        val uri = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId)
        try {
            return resolver.openInputStream(uri) ?: throw FileNotFoundException(name)
        } catch (e: SecurityException) {
            throw SourceAccessException(ErrorCodes.PERMISSION_LOST, "permission denied", e)
        } catch (e: IOException) {
            throw e
        } catch (e: RuntimeException) {
            throw SourceAccessException(ErrorCodes.PROVIDER_ERROR, e.javaClass.simpleName, e)
        }
    }

    companion object {
        /** Guards against providers returning absurdly large listings. */
        const val MAX_CHILDREN = 10_000
    }
}
