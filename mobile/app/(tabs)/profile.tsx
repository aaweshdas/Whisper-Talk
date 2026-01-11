import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ScrollView, Pressable } from "react-native";

const ProfileTab = () => {
  const { signOut } = useAuth();
  return (
    <ScrollView className="bg-surface" contentInsetAdjustmentBehavior="automatic">
      <Text className="text-white">Profile Tab</Text>
      <Pressable onPress={() => signOut()} className="mt-4 bg-red-600 px-4 py-2 rounded-lg">
        <Text>Signout</Text>
      </Pressable>
    </ScrollView>
  );
};

export default ProfileTab;
