const fs = require('fs');
const path = require('path');

// Path to the problematic build.gradle in node_modules
const gradlePath = path.join(process.cwd(), 'node_modules', 'react-native-text-recognition', 'android', 'build.gradle');

if (fs.existsSync(gradlePath)) {
    try {
        let content = fs.readFileSync(gradlePath, 'utf8');

        // Replace the hardcoded SDK 29 values with the root project's values
        // or a safe default of 34 (required for Java 9+ source compatibility)
        console.log('Fixing react-native-text-recognition build.gradle SDK versions...');

        content = content.replace(
            /compileSdkVersion safeExtGet\('TextRecognition_compileSdkVersion', 29\)/g,
            "compileSdkVersion safeExtGet('compileSdkVersion', 34)"
        );
        content = content.replace(
            /targetSdkVersion safeExtGet\('TextRecognition_targetSdkVersion', 29\)/g,
            "targetSdkVersion safeExtGet('targetSdkVersion', 34)"
        );
        content = content.replace(
            /buildToolsVersion safeExtGet\('TextRecognition_buildToolsVersion', '29.0.2'\)/g,
            "buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')"
        );

        fs.writeFileSync(gradlePath, content);
        console.log('Successfully patched react-native-text-recognition!');
    } catch (error) {
        console.error('Failed to patch react-native-text-recognition:', error.message);
    }
} else {
    console.log('react-native-text-recognition build.gradle not found at:', gradlePath);
}
