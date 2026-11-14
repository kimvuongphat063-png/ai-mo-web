package vn.family.kidsgamesplayer.ui

import android.content.Context
import vn.family.kidsgamesplayer.R
import vn.family.kidsgamesplayer.core.ErrorCodes

/** Parent-facing Vietnamese text for stable error codes. */
object ErrorTexts {
    fun describe(context: Context, code: String?): String {
        val res = when (code) {
            null -> return ""
            ErrorCodes.MANIFEST_TOO_LARGE, ErrorCodes.MANIFEST_INVALID_JSON, ErrorCodes.MANIFEST_INVALID_FIELD,
            ErrorCodes.MANIFEST_BAD_PATH, ErrorCodes.MANIFEST_BAD_FILES -> R.string.err_manifest
            ErrorCodes.MANIFEST_UNSUPPORTED_SCHEMA -> R.string.err_schema
            ErrorCodes.MANIFEST_BAD_ID -> R.string.err_bad_id
            ErrorCodes.MANIFEST_RESERVED_ID -> R.string.err_reserved_id
            ErrorCodes.MANIFEST_BAD_ENTRY, ErrorCodes.MISSING_ENTRY -> R.string.err_entry
            ErrorCodes.MANIFEST_UNSUPPORTED_PLAYER_API -> R.string.err_player_api
            ErrorCodes.INCOMPLETE_PACKAGE -> R.string.err_incomplete
            ErrorCodes.SOURCE_CHANGED -> R.string.err_source_changed
            ErrorCodes.QUOTA_BYTES, ErrorCodes.QUOTA_FILES, ErrorCodes.QUOTA_DEPTH,
            ErrorCodes.QUOTA_FILE_SIZE, ErrorCodes.QUOTA_ENTRY_SIZE -> R.string.err_quota
            ErrorCodes.QUOTA_GAMES -> R.string.err_too_many_games
            ErrorCodes.PATH_REJECTED, ErrorCodes.PATH_COLLISION -> R.string.err_path
            ErrorCodes.DUPLICATE_ID -> R.string.err_duplicate_id
            ErrorCodes.NO_SPACE -> R.string.err_no_space
            ErrorCodes.IO_ERROR -> R.string.err_io
            ErrorCodes.PERMISSION_LOST -> R.string.err_permission
            ErrorCodes.PROVIDER_ERROR -> R.string.err_provider
            ErrorCodes.REVISION_MISSING -> R.string.err_revision_missing
            else -> return context.getString(R.string.err_generic, code)
        }
        return context.getString(res)
    }
}
