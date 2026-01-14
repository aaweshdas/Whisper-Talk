import { useAuth } from "@clerk/clerk-react";

function ChatPage() {
  const { signOut } = useAuth();
  return (
    <div>
      ChatPage
      <button onClick={signOut}>SIGNOUT</button>
    </div>
  );
}
export default ChatPage;
