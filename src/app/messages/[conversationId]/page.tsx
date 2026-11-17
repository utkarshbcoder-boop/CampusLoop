import type { Metadata } from "next";
import { ThreadView } from "@/components/messages/ThreadView";

export const metadata: Metadata = {
  title: "Conversation",
  description: "Message a buyer or seller about a listing or property on CampusLoop.",
};

/**
 * Route contract: MessageSellerButton navigates to `/messages/${conversationId}`,
 * so the thread lives at this exact dynamic segment.
 */
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ThreadView conversationId={conversationId} />;
}
