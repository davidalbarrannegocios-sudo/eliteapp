import { redirect } from "next/navigation";

export default function CommunityPage({ params }: { params: { id: string } }) {
  redirect(`/community/${params.id}/announcements`);
}
