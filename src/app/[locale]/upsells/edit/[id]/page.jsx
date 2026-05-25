'use client';
import { useParams } from "next/navigation";


export default function UpsellEditPage() {
    const { id } = useParams();

    return (
        <div>
            <h1>Ups Upsell {id}</h1>
        </div>
    )
}