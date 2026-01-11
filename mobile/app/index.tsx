import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="text-red-500 text-4xl bg-orange-500">Hello</Text>
    </View>
  );
}

// TODO: provide this in video desc;
// bun install nativewind react-native-reanimated@~3.17.4 react-native-safe-area-context@5.4.0
// bun install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
