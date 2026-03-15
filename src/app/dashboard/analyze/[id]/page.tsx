import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AnalysisDetailClient from "./AnalysisDetailClient";

export default async function AnalysisDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: analysis, error } = await supabase
    .from('skin_analyses')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !analysis) {
    redirect('/dashboard/history');
  }

  return <AnalysisDetailClient analysis={analysis} />;
}
