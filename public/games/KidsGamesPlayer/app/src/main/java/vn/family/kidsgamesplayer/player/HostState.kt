package vn.family.kidsgamesplayer.player

import org.json.JSONObject

/** Reasons sent to games; a closed set (bible §13.2). */
enum class HostReason(val wire: String) {
    START("start"), RESUME("resume"), PARENT("parent"), BACKGROUND("background"),
    HOME("home"), RESTART("restart"), SOUND_CHANGED("sound_changed"),
}

/** State the native host pushes into a game page. Contains no PIN, URI or internal path. */
data class HostState(
    val seq: Int,
    val active: Boolean,
    val muted: Boolean,
    val reason: HostReason,
    val requestSave: Boolean,
) {
    fun toJson(): String = JSONObject()
        .put("apiVersion", 1)
        .put("seq", seq)
        .put("active", active)
        .put("muted", muted)
        .put("reason", reason.wire)
        .put("requestSave", requestSave)
        .toString()

    /**
     * The only script the host ever evaluates in a game: a fixed wrapper with a
     * library-serialized JSON literal. Returns "ok", "absent" or "error".
     */
    fun script(): String =
        "(function(s){try{var g=window.KidsPlayerGame;" +
            "if(!g||typeof g.onHostState!=='function'){return 'absent';}" +
            "g.onHostState(s);return 'ok';}catch(e){return 'error';}})(" + toJson() + ")"
}

/** Single audibility rule (bible §10.2). */
object AudioPolicy {
    fun shouldBeAudible(
        activityForeground: Boolean,
        screenIsGame: Boolean,
        sessionPlaying: Boolean,
        parentGateClosed: Boolean,
        userSoundEnabled: Boolean,
    ): Boolean = activityForeground && screenIsGame && sessionPlaying && parentGateClosed && userSoundEnabled

    /**
     * Without native MUTE_AUDIO, a non-SDK game cannot be guaranteed silent: launching
     * it while sound is off must be refused before any HTML loads (bible §10.3).
     */
    fun mustBlockLaunch(muteSupported: Boolean, sdkGame: Boolean, userSoundEnabled: Boolean): Boolean =
        !muteSupported && !sdkGame && !userSoundEnabled
}
