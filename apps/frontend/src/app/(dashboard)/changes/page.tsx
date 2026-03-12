'use client'
import { redirect } from 'next/navigation'
export default function ChangesPage() { redirect('/incidents?type=change') }
