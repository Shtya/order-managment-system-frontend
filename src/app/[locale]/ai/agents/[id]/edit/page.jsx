"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import AgentWizard from "../../atoms/wizard/AgentWizard";


function EditAgentInner() {
  const params = useParams();
  const agentId = params?.id;

  return <AgentWizard mode="edit" agentId={agentId} />;
}

export default function EditAgentPage() {
  return (
    <Suspense>
      <EditAgentInner />
    </Suspense>
  );
}
