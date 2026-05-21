import EditWhatsAppTemplatePage from "@/app/[locale]/whatsapp/templates/edit/[id]/page";


export default function WhatsAppTemplatesEditPage() {
    return (
        <div>
            <EditWhatsAppTemplatePage superAdmin={true} />
        </div>
    );
}