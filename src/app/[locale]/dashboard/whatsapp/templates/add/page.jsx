import  WhatsAppTemplateFormPage  from "@/app/[locale]/whatsapp/templates/add/page";


export default function WhatsAppTemplatesAddPage() {
    return (
        <div>
           <WhatsAppTemplateFormPage superAdmin={true} />
        </div>
    );
}