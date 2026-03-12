'use client'
import { redirect } from 'next/navigation'
export default function ServiceRequestsPage() { redirect('/incidents?type=service_request') }
