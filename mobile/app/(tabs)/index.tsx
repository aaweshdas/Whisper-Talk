import { ScrollView, Text } from "react-native";

const ChatsTab = () => {
  return (
    <ScrollView className="bg-surface" contentInsetAdjustmentBehavior="automatic">
      <Text className="text-white">Chats Tab</Text>
    </ScrollView>
  );
};

export default ChatsTab;

// TODO: provide this in video desc;
// bun install nativewind react-native-reanimated@~3.17.4 react-native-safe-area-context@5.4.0
// bun install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
