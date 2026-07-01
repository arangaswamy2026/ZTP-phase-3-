import { useState } from 'react';
import { X, Search, LayoutGrid, ExternalLink, Lock, Users, Tag, Building2, Globe, ChevronDown } from 'lucide-react';

export type SaasApp = {
  name: string;
  category: string;
  vendor: string;
  description: string;
  domains: string[];
  protocols: string[];
  dataClassification: 'Public' | 'Internal' | 'Confidential';
  ssoSupport: boolean;
  tags: string[];
};

export const SAAS_APPLICATIONS: SaasApp[] = [
  { name: 'Microsoft 365',        category: 'Productivity',  vendor: 'Microsoft',  description: 'Cloud-based suite of Office productivity apps including Word, Excel, PowerPoint, and more.', domains: ['*.office.com', '*.microsoftonline.com', '*.office365.com'], protocols: ['HTTPS', 'SMTP', 'IMAP'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Office', 'Email', 'Documents'] },
  { name: 'Microsoft Teams',      category: 'Collaboration', vendor: 'Microsoft',  description: 'Unified communication and collaboration platform with chat, video meetings, and file sharing.', domains: ['*.teams.microsoft.com', '*.skype.com'], protocols: ['HTTPS', 'WebSocket', 'UDP'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Chat', 'Video', 'Meetings'] },
  { name: 'SharePoint',           category: 'Productivity',  vendor: 'Microsoft',  description: 'Web-based collaboration and document management platform for enterprise teams.', domains: ['*.sharepoint.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Documents', 'Intranet', 'Collaboration'] },
  { name: 'OneDrive',             category: 'Storage',       vendor: 'Microsoft',  description: 'Personal cloud storage service integrated with Microsoft 365 for file sync and sharing.', domains: ['*.onedrive.com', '*.onedrive.live.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Storage', 'Sync', 'Backup'] },
  { name: 'Outlook Web',          category: 'Productivity',  vendor: 'Microsoft',  description: 'Browser-based access to Microsoft Exchange email, calendar, and contacts.', domains: ['outlook.office.com', 'outlook.office365.com'], protocols: ['HTTPS', 'SMTP'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Email', 'Calendar'] },
  { name: 'Google Workspace',     category: 'Productivity',  vendor: 'Google',     description: 'Integrated suite of cloud-based productivity and collaboration tools including Docs, Sheets, and Slides.', domains: ['*.google.com', '*.googleapis.com', 'workspace.google.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Office', 'Email', 'Documents'] },
  { name: 'Google Drive',         category: 'Storage',       vendor: 'Google',     description: 'Cloud file storage, synchronization, and sharing service integrated with Google Workspace.', domains: ['drive.google.com', '*.googleapis.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Storage', 'Sync', 'Sharing'] },
  { name: 'Google Meet',          category: 'Collaboration', vendor: 'Google',     description: 'Secure video conferencing service built for teams, integrated with Google Calendar.', domains: ['meet.google.com'], protocols: ['HTTPS', 'WebRTC', 'UDP'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Video', 'Meetings'] },
  { name: 'Gmail',                category: 'Productivity',  vendor: 'Google',     description: 'Web-based email service with 15 GB storage, powerful search, and spam protection.', domains: ['mail.google.com', 'smtp.gmail.com'], protocols: ['HTTPS', 'SMTP', 'IMAP'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Email'] },
  { name: 'Slack',                category: 'Collaboration', vendor: 'Salesforce', description: 'Messaging platform for teams with channels, direct messages, file sharing, and integrations.', domains: ['*.slack.com', 'slack-edge.com'], protocols: ['HTTPS', 'WebSocket'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Chat', 'Notifications', 'Integrations'] },
  { name: 'Zoom',                 category: 'Collaboration', vendor: 'Zoom',       description: 'Cloud-based video conferencing platform for meetings, webinars, and team collaboration.', domains: ['*.zoom.us', '*.zoomgov.com'], protocols: ['HTTPS', 'UDP', 'TCP'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Video', 'Webinars', 'Meetings'] },
  { name: 'Webex',                category: 'Collaboration', vendor: 'Cisco',      description: 'Enterprise video conferencing, messaging, and calling suite by Cisco.', domains: ['*.webex.com', '*.ciscospark.com'], protocols: ['HTTPS', 'SIP', 'UDP'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Video', 'Calling', 'Enterprise'] },
  { name: 'Salesforce',           category: 'CRM',           vendor: 'Salesforce', description: 'Cloud-based CRM platform for sales, service, marketing, and analytics.', domains: ['*.salesforce.com', '*.force.com', '*.my.salesforce.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['CRM', 'Sales', 'Analytics'] },
  { name: 'HubSpot',              category: 'CRM',           vendor: 'HubSpot',    description: 'Inbound marketing, sales, and service software platform for growing businesses.', domains: ['*.hubspot.com', '*.hubspotusercontent.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Marketing', 'CRM', 'Email'] },
  { name: 'Zendesk',              category: 'CRM',           vendor: 'Zendesk',    description: 'Customer service software and support ticketing system for businesses of all sizes.', domains: ['*.zendesk.com', '*.zendeskcdn.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Support', 'Ticketing', 'Customer Service'] },
  { name: 'ServiceNow',           category: 'ITSM',          vendor: 'ServiceNow', description: 'Cloud-based IT service management platform for digital workflows and IT operations.', domains: ['*.service-now.com', '*.servicenowservices.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['ITSM', 'Workflows', 'Automation'] },
  { name: 'Jira',                 category: 'Dev Tools',     vendor: 'Atlassian',  description: 'Issue and project tracking software for agile software development teams.', domains: ['*.atlassian.net', '*.jira.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Agile', 'Tracking', 'Projects'] },
  { name: 'Confluence',           category: 'Dev Tools',     vendor: 'Atlassian',  description: 'Team workspace and wiki platform for knowledge sharing and collaboration.', domains: ['*.atlassian.net', '*.confluence.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Wiki', 'Docs', 'Knowledge Base'] },
  { name: 'GitHub',               category: 'Dev Tools',     vendor: 'Microsoft',  description: 'Web-based Git repository hosting service with CI/CD, issue tracking, and code review.', domains: ['github.com', '*.github.com', 'api.github.com'], protocols: ['HTTPS', 'SSH', 'Git'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Git', 'CI/CD', 'Code Review'] },
  { name: 'GitLab',               category: 'Dev Tools',     vendor: 'GitLab',     description: 'Complete DevOps platform with source control, CI/CD pipelines, and security scanning.', domains: ['gitlab.com', '*.gitlab.com'], protocols: ['HTTPS', 'SSH', 'Git'], dataClassification: 'Internal', ssoSupport: true,  tags: ['DevOps', 'CI/CD', 'Git'] },
  { name: 'Box',                  category: 'Storage',       vendor: 'Box',        description: 'Cloud content management and file sharing platform with enterprise security controls.', domains: ['*.box.com', '*.boxcdn.net'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['Storage', 'DRM', 'Collaboration'] },
  { name: 'Dropbox',              category: 'Storage',       vendor: 'Dropbox',    description: 'Cloud storage and file synchronization service with team collaboration features.', domains: ['*.dropbox.com', '*.dropboxusercontent.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Storage', 'Sync', 'Sharing'] },
  { name: 'Okta',                 category: 'Identity',      vendor: 'Okta',       description: 'Identity and access management platform providing SSO, MFA, and lifecycle management.', domains: ['*.okta.com', '*.oktapreview.com'], protocols: ['HTTPS', 'SAML', 'OIDC'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['IAM', 'SSO', 'MFA'] },
  { name: 'Azure AD',             category: 'Identity',      vendor: 'Microsoft',  description: "Microsoft's cloud-based identity and access management service for enterprise environments.", domains: ['login.microsoftonline.com', '*.aadcdn.msftauth.net'], protocols: ['HTTPS', 'SAML', 'OAuth'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['IAM', 'SSO', 'Conditional Access'] },
  { name: 'Workday',              category: 'HR',            vendor: 'Workday',    description: 'Cloud HR, payroll, and finance management platform for enterprise organizations.', domains: ['*.workday.com', '*.workdaystatic.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['HCM', 'Payroll', 'Finance'] },
  { name: 'BambooHR',             category: 'HR',            vendor: 'BambooHR',   description: 'HR software for small and medium businesses covering employee records, PTO, and hiring.', domains: ['*.bamboohr.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['HR', 'Recruiting', 'PTO'] },
  { name: 'QuickBooks Online',    category: 'Finance',       vendor: 'Intuit',     description: 'Cloud-based accounting and financial management software for small businesses.', domains: ['*.quickbooks.intuit.com', '*.intuit.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: false, tags: ['Accounting', 'Invoicing', 'Payroll'] },
  { name: 'NetSuite',             category: 'Finance',       vendor: 'Oracle',     description: 'Cloud-based ERP suite covering financials, CRM, e-commerce, and inventory management.', domains: ['*.netsuite.com', '*.netsuitestaging.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['ERP', 'Accounting', 'Inventory'] },
  { name: 'Stripe',               category: 'Finance',       vendor: 'Stripe',     description: 'Online payment processing platform for internet businesses and developer-friendly APIs.', domains: ['*.stripe.com', 'dashboard.stripe.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: false, tags: ['Payments', 'Billing', 'API'] },
  { name: 'DocuSign',             category: 'Productivity',  vendor: 'DocuSign',   description: 'Electronic signature and digital transaction management platform for agreements.', domains: ['*.docusign.com', '*.docusign.net'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['e-Signature', 'Contracts', 'Legal'] },
  { name: 'Notion',               category: 'Productivity',  vendor: 'Notion',     description: 'All-in-one workspace for notes, docs, databases, wikis, and project management.', domains: ['*.notion.so', 'notion.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Notes', 'Wiki', 'Project Management'] },
  { name: 'Monday.com',           category: 'Productivity',  vendor: 'Monday.com', description: 'Work operating system for team management, project tracking, and workflow automation.', domains: ['*.monday.com', 'auth.monday.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Work Management', 'Projects', 'Automation'] },
  { name: 'Asana',                category: 'Productivity',  vendor: 'Asana',      description: 'Project and task management tool for team collaboration and work tracking.', domains: ['*.asana.com', 'app.asana.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Tasks', 'Projects', 'Workflows'] },
  { name: 'Trello',               category: 'Productivity',  vendor: 'Atlassian',  description: 'Visual project management tool using boards, lists, and cards for task organization.', domains: ['*.trello.com', 'trello.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Kanban', 'Tasks', 'Projects'] },
  { name: 'Figma',                category: 'Design',        vendor: 'Figma',      description: 'Browser-based UI design and prototyping tool for collaborative interface design.', domains: ['*.figma.com', 'figma-alpha-api.s3.us-west-2.amazonaws.com'], protocols: ['HTTPS', 'WebSocket'], dataClassification: 'Internal', ssoSupport: true,  tags: ['UI Design', 'Prototyping', 'Collaboration'] },
  { name: 'Adobe Creative Cloud', category: 'Design',        vendor: 'Adobe',      description: 'Suite of creative desktop and mobile apps including Photoshop, Illustrator, and Premiere Pro.', domains: ['*.adobe.com', '*.adobecc.com', '*.adobelogin.com'], protocols: ['HTTPS'], dataClassification: 'Internal', ssoSupport: true,  tags: ['Creative', 'Design', 'Video'] },
  { name: 'Canva',                category: 'Design',        vendor: 'Canva',      description: 'Online graphic design platform for creating presentations, social media content, and marketing materials.', domains: ['*.canva.com', 'canva.com'], protocols: ['HTTPS'], dataClassification: 'Public', ssoSupport: true,  tags: ['Graphics', 'Templates', 'Marketing'] },
  { name: 'AWS Console',          category: 'Cloud',         vendor: 'Amazon',     description: 'Web-based management console for Amazon Web Services cloud infrastructure and services.', domains: ['*.aws.amazon.com', '*.console.aws.amazon.com', 'signin.aws.amazon.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['IaaS', 'DevOps', 'Infrastructure'] },
  { name: 'Azure Portal',         category: 'Cloud',         vendor: 'Microsoft',  description: 'Unified web console for managing Microsoft Azure cloud services and resources.', domains: ['portal.azure.com', '*.azure.com', '*.azure.net'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['IaaS', 'PaaS', 'Infrastructure'] },
  { name: 'Google Cloud Console', category: 'Cloud',         vendor: 'Google',     description: 'Web-based interface for managing Google Cloud Platform resources and services.', domains: ['console.cloud.google.com', '*.googleapis.com'], protocols: ['HTTPS'], dataClassification: 'Confidential', ssoSupport: true,  tags: ['IaaS', 'PaaS', 'DevOps'] },
];

function classificationColor(c: SaasApp['dataClassification']) {
  if (c === 'Confidential') return 'bg-red-50 text-red-700 border-red-200';
  if (c === 'Internal')     return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-green-50 text-green-700 border-green-200';
}

export function AppDetailModal({ app, onClose }: { app: SaasApp; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-[12px] shadow-2xl w-[520px] max-h-[80vh] flex flex-col pointer-events-auto">

          <div className="flex items-start justify-between px-[24px] py-[18px] border-b border-[#e5e7eb]">
            <div>
              <div className="font-['Inter',sans-serif] font-bold text-[15px] text-[#101828]">{app.name}</div>
              <div className="flex items-center gap-[6px] mt-[4px]">
                <span className="text-[11px] text-[#6a7282]">{app.vendor}</span>
                <span className="text-[#d1d5db]">·</span>
                <span className="text-[11px] text-[#6a7282]">{app.category}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#364153] transition-colors shrink-0 mt-[2px]"
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>

          <div className="overflow-y-auto px-[24px] py-[20px] flex flex-col gap-[18px]">
            <p className="text-[13px] text-[#364153] leading-[1.6]">{app.description}</p>

            <div className="flex flex-wrap gap-[8px]">
              <span className={`inline-flex items-center gap-[5px] text-[11px] font-semibold px-[8px] py-[3px] rounded-[6px] border ${classificationColor(app.dataClassification)}`}>
                <Lock className="w-[10px] h-[10px]" />
                {app.dataClassification}
              </span>
              <span className={`inline-flex items-center gap-[5px] text-[11px] font-semibold px-[8px] py-[3px] rounded-[6px] border ${app.ssoSupport ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#f9fafb] text-[#6a7282] border-[#e5e7eb]'}`}>
                <Users className="w-[10px] h-[10px]" />
                SSO {app.ssoSupport ? 'Supported' : 'Not Supported'}
              </span>
            </div>

            <div className="bg-[#f9fafb] rounded-[8px] border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
              <div className="flex items-center justify-between px-[14px] py-[10px]">
                <span className="flex items-center gap-[6px] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">
                  <Building2 className="w-[11px] h-[11px]" /> Vendor
                </span>
                <span className="text-[13px] text-[#364153] font-medium">{app.vendor}</span>
              </div>
              <div className="flex items-center justify-between px-[14px] py-[10px]">
                <span className="flex items-center gap-[6px] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">
                  <LayoutGrid className="w-[11px] h-[11px]" /> Category
                </span>
                <span className="text-[13px] text-[#364153] font-medium">{app.category}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-[6px] mb-[8px]">
                <Globe className="w-[12px] h-[12px] text-[#9ca3af]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">Domains / Endpoints</span>
              </div>
              <div className="flex flex-col gap-[4px]">
                {app.domains.map((d) => (
                  <div key={d} className="font-mono text-[12px] text-[#364153] bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[10px] py-[5px]">{d}</div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-[6px] mb-[8px]">
                <ExternalLink className="w-[12px] h-[12px] text-[#9ca3af]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">Protocols</span>
              </div>
              <div className="flex flex-wrap gap-[6px]">
                {app.protocols.map((p) => (
                  <span key={p} className="text-[11px] font-semibold text-[#364153] bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[8px] py-[4px]">{p}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-[6px] mb-[8px]">
                <Tag className="w-[12px] h-[12px] text-[#9ca3af]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">Tags</span>
              </div>
              <div className="flex flex-wrap gap-[6px]">
                {app.tags.map((t) => (
                  <span key={t} className="text-[11px] text-[#6a7282] bg-[#f9fafb] border border-[#e5e7eb] rounded-full px-[8px] py-[3px]">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-[24px] py-[14px] border-t border-[#e5e7eb] flex justify-end">
            <button
              onClick={onClose}
              className="h-[36px] px-[20px] text-[13px] font-semibold text-[#364153] bg-white border border-[#e5e7eb] rounded-[8px] hover:bg-[#f9fafb] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Reusable dropdown picker + pills below
export function SaasAppPicker({
  selectedItems,
  onToggle,
  onRemove,
  onViewDetails,
}: {
  selectedItems: string[];
  onToggle: (app: string) => void;
  onRemove: (app: string) => void;
  onViewDetails: (app: SaasApp) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = SAAS_APPLICATIONS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, string[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a.name);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col gap-[6px]">
      {/* Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full bg-white border border-[#e5e7eb] rounded-[8px] h-[43px] px-[13px] flex items-center justify-between text-left"
        >
          <span className="text-[13px] text-[#9ca3af]">Search</span>
          <ChevronDown className="w-[16px] h-[16px] text-[#717182] opacity-50 shrink-0" />
        </button>

        {open && (
          <>
            {/* click-outside capture */}
            <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-[50] flex flex-col">
              {/* Search input */}
              <div className="p-[8px] border-b border-[#e5e7eb]">
                <div className="relative">
                  <Search className="w-[13px] h-[13px] absolute left-[9px] top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search applications…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-[32px] pl-[28px] pr-[8px] text-[13px] text-[#1a1a1a] border border-[#e5e7eb] rounded-[6px] bg-[#f9fafb] focus:outline-none focus:border-[#0066cc] placeholder:text-[#9ca3af]"
                  />
                </div>
              </div>

              {/* Grouped list */}
              <div className="max-h-[260px] overflow-y-auto py-[4px]">
                {Object.keys(grouped).length === 0 ? (
                  <div className="px-[13px] py-[10px] text-[13px] text-[#9ca3af]">No applications match</div>
                ) : (
                  Object.entries(grouped).map(([category, apps]) => (
                    <div key={category}>
                      <div className="px-[13px] pt-[8px] pb-[4px] flex items-center gap-[6px]">
                        <LayoutGrid className="w-[11px] h-[11px] text-[#9ca3af]" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">{category}</span>
                      </div>
                      {apps.map((app) => (
                        <div
                          key={app}
                          onClick={() => onToggle(app)}
                          className="px-[13px] py-[7px] hover:bg-[#f9fafb] cursor-pointer flex items-center gap-[8px] group"
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedItems.includes(app)}
                            className="w-[13px] h-[13px] accent-[#0066cc] shrink-0"
                          />
                          <span className="text-[13px] text-[#364153] flex-1">{app}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const meta = SAAS_APPLICATIONS.find((a) => a.name === app);
                              if (meta) onViewDetails(meta);
                            }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-[3px] text-[11px] text-[#0066cc] hover:underline transition-opacity shrink-0"
                          >
                            <ExternalLink className="w-[10px] h-[10px]" />
                            View details
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pills */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-[8px]">
          {selectedItems.map((item) => (
            <div
              key={item}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] px-[8px] pr-[24px] py-[5px] h-[30px] flex items-center relative"
            >
              <span className="font-['Inter',sans-serif] font-medium text-[12px] text-[#364153]">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="absolute right-[7px] top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6a7282]"
              >
                <X className="w-[10px] h-[10px]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
