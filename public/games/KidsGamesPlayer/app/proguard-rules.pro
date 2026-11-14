# Kids Games Player release shrinking rules.
# The app has no reflection-based serialization and no JavaScript bridge
# (addJavascriptInterface is never used), so the default optimize rules suffice.
# Keep source file/line info for readable diagnostics stack traces.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
