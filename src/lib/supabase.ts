/**
 * Supabase client for marketing-crm integration
 * Used for lead management - syncs with BigQuery for analytics
 *
 * SCHEMA REFERENCE: marketing-crm/migrations/archive/crm-schema-v2.sql
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types matching actual Supabase schema (contacts table)
export interface Contact {
  id: number; // SERIAL PRIMARY KEY (INT, not UUID)
  tenant_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  phone_secondary?: string;
  company_name?: string;
  job_title?: string;
  website?: string;
  contact_type: string; // 'individual' | 'business'
  lifecycle_stage: string; // 'subscriber' | 'lead' | 'marketing_qualified' | etc.
  original_source?: string;
  lead_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  last_contacted_at?: string;
  last_activity_at?: string;
  email_status: string; // 'valid' | 'bounced' | 'unsubscribed'
  opt_in_marketing: boolean;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Types matching actual Supabase schema (leads table)
// Note: leads has dedicated columns for event data, NOT custom_fields
export interface Lead {
  id?: number;
  tenant_id: number;
  contact_id?: number; // INT, not string!
  campaign_id?: number;
  opportunity_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  preferred_contact?: string;
  message?: string;
  lead_status: string;
  lead_score: number;
  lead_quality?: string;
  booking_value?: number;
  // Attribution
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  lead_source?: string;
  referrer?: string;
  landing_page?: string;
  ga_client_id?: string;
  ga_session_id?: string;
  source_page?: string;
  form_type?: string;
  // Event-specific fields (actual columns, not custom_fields)
  touchpoint_type?: string;
  event_type?: string;
  event_date?: string;
  event_time?: string;
  guest_count?: string;
  location?: string;
  service_style?: string;
  budget_range?: string;
  dietary_requirements?: string[];
  event_description?: string;
  has_event?: boolean;
  // Tracking
  processed?: boolean;
  processed_at?: string;
  archived?: boolean;
  archived_at?: string;
  archived_reason?: string;
  // JSONB for any additional fields
  custom_fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// Chef Nam tenant ID (from marketing-crm database)
export const CHEF_NAM_TENANT_ID = 1;

/**
 * Create Supabase client with service role key
 * Service role bypasses RLS - only use server-side
 */
export function createSupabaseClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Find existing contact by email or create new one
 * Uses the ACTUAL contacts table schema from marketing-crm
 */
export async function findOrCreateContact(
  supabase: SupabaseClient,
  tenantId: number,
  contactData: {
    email: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    gclid?: string;
    lead_source?: string;
  }
): Promise<{ success: boolean; contact?: Contact; isReturning: boolean; error?: string }> {
  const normalizedEmail = contactData.email.trim().toLowerCase();

  try {
    // Check for existing contact
    const { data: existingContact, error: findError } = await supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', normalizedEmail)
      .single();

    if (existingContact && !findError) {
      // Returning customer - update last_activity_at
      const { data: updated, error: updateError } = await supabase
        .from('contacts')
        .update({
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Update phone/name if provided and currently null
          ...(contactData.phone && !existingContact.phone ? { phone: contactData.phone } : {}),
          ...(contactData.first_name && !existingContact.first_name ? { first_name: contactData.first_name } : {}),
          ...(contactData.last_name && !existingContact.last_name ? { last_name: contactData.last_name } : {}),
        })
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating contact:', updateError);
      }

      console.log('🔄 Returning customer found:', normalizedEmail);
      return {
        success: true,
        contact: updated || existingContact,
        isReturning: true,
      };
    }

    // New contact - create with schema-appropriate fields
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        tenant_id: tenantId,
        email: normalizedEmail,
        phone: contactData.phone,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        contact_type: 'individual',
        lifecycle_stage: 'lead',
        original_source: contactData.lead_source || 'website_form',
        lead_source: contactData.lead_source,
        utm_source: contactData.utm_source,
        utm_medium: contactData.utm_medium,
        utm_campaign: contactData.utm_campaign,
        gclid: contactData.gclid,
        last_activity_at: new Date().toISOString(),
        email_status: 'valid',
        opt_in_marketing: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating contact:', createError);
      return { success: false, isReturning: false, error: createError.message };
    }

    console.log('✨ New contact created:', normalizedEmail);
    return {
      success: true,
      contact: newContact,
      isReturning: false,
    };
  } catch (error) {
    console.error('findOrCreateContact exception:', error);
    return { success: false, isReturning: false, error: String(error) };
  }
}

/**
 * Insert lead into Supabase
 * Uses actual leads table columns - event fields are columns, NOT custom_fields
 */
export async function insertLeadSupabase(
  supabase: SupabaseClient,
  tenantId: number,
  contactId: number | undefined,
  leadData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    preferred_contact?: string;
    message?: string;
    // Attribution
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    fbclid?: string;
    ga_client_id?: string;
    lead_source?: string;
    landing_page?: string;
    referrer?: string;
    source_page?: string;
    // Event fields (actual columns)
    event_type?: string;
    event_date?: string;
    event_time?: string;
    guest_count?: string;
    location?: string;
    service_style?: string;
    budget_range?: string;
    dietary_requirements?: string[];
    has_event?: boolean;
    event_description?: string;
  }
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email?.trim().toLowerCase(),
        phone: leadData.phone,
        preferred_contact: leadData.preferred_contact,
        message: leadData.message,
        lead_status: 'new',
        lead_score: 0,
        touchpoint_type: 'form_submission',
        // Attribution
        utm_source: leadData.utm_source,
        utm_medium: leadData.utm_medium,
        utm_campaign: leadData.utm_campaign,
        utm_term: leadData.utm_term,
        utm_content: leadData.utm_content,
        gclid: leadData.gclid,
        fbclid: leadData.fbclid,
        ga_client_id: leadData.ga_client_id,
        lead_source: leadData.lead_source,
        landing_page: leadData.landing_page,
        referrer: leadData.referrer,
        source_page: leadData.source_page,
        // Event fields as actual columns (not custom_fields!)
        event_type: leadData.event_type,
        event_date: leadData.event_date,
        event_time: leadData.event_time,
        guest_count: leadData.guest_count,
        location: leadData.location,
        service_style: leadData.service_style,
        budget_range: leadData.budget_range,
        dietary_requirements: leadData.dietary_requirements,
        has_event: leadData.has_event,
        event_description: leadData.event_description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting lead:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Lead inserted to Supabase:', lead.id);
    return { success: true, lead };
  } catch (error) {
    console.error('insertLead exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Full flow: Find/create contact, then create lead
 */
export async function createLeadWithContact(
  supabase: SupabaseClient,
  tenantId: number,
  formData: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    preferredContact?: string;
    message?: string;
    eventType?: string;
    eventDate?: string;
    eventTime?: string;
    guestCount?: string;
    location?: string;
    serviceStyle?: string;
    budgetRange?: string;
    dietaryRequirements?: string[];
    hasEvent?: string;
    eventDescription?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    fbclid?: string;
    ga_client_id?: string;
    lead_source?: string;
    landing_page?: string;
    referrer?: string;
    submitted_from_url?: string;
  }
): Promise<{ success: boolean; contactId?: number; leadId?: number; isReturning: boolean; error?: string }> {
  // 1. Find or create contact
  const contactResult = await findOrCreateContact(supabase, tenantId, {
    email: formData.email,
    phone: formData.phone,
    first_name: formData.firstName,
    last_name: formData.lastName,
    utm_source: formData.utm_source,
    utm_medium: formData.utm_medium,
    utm_campaign: formData.utm_campaign,
    gclid: formData.gclid,
    lead_source: formData.lead_source,
  });

  if (!contactResult.success) {
    return { success: false, isReturning: false, error: contactResult.error };
  }

  // 2. Insert lead with event fields as actual columns
  const leadResult = await insertLeadSupabase(supabase, tenantId, contactResult.contact?.id, {
    first_name: formData.firstName,
    last_name: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    preferred_contact: formData.preferredContact,
    message: formData.message,
    utm_source: formData.utm_source,
    utm_medium: formData.utm_medium,
    utm_campaign: formData.utm_campaign,
    utm_term: formData.utm_term,
    utm_content: formData.utm_content,
    gclid: formData.gclid,
    fbclid: formData.fbclid,
    ga_client_id: formData.ga_client_id,
    lead_source: formData.lead_source,
    landing_page: formData.landing_page,
    referrer: formData.referrer,
    source_page: formData.submitted_from_url,
    // Event fields as actual columns
    event_type: formData.eventType,
    event_date: formData.eventDate,
    event_time: formData.eventTime,
    guest_count: formData.guestCount,
    location: formData.location,
    service_style: formData.serviceStyle,
    budget_range: formData.budgetRange,
    dietary_requirements: formData.dietaryRequirements,
    has_event: formData.hasEvent === 'yes',
    event_description: formData.eventDescription,
  });

  if (!leadResult.success) {
    return { success: false, isReturning: contactResult.isReturning, error: leadResult.error };
  }

  return {
    success: true,
    contactId: contactResult.contact?.id,
    leadId: leadResult.lead?.id,
    isReturning: contactResult.isReturning,
  };
}
