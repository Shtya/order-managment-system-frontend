'use client'
import { useParams } from "next/navigation";

export default function EditAutomationsPage() {
    const params = useParams();
    const automationId = params?.id;
    return (
        <div>
            <h1>Edit Automations</h1>
        </div>
    );
}