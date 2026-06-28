/**
 * Mock data for the Notifications page (/notifications): notification RULES that
 * fire on trigger events, plus a delivery log of recently sent notifications.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type Channel = 'in-app' | 'email' | 'webhook';

export interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  channels: Channel[];
  recipients: string;
  enabled: boolean;
}

export const rules: NotificationRule[] = [
  {
    id: 'rule_recall',
    name: 'Recall fan-out',
    trigger: 'Recall · initiated',
    channels: ['in-app', 'email', 'webhook'],
    recipients: 'Impacted dealers, Quality team',
    enabled: true,
  },
  {
    id: 'rule_qchold',
    name: 'QC hold raised',
    trigger: 'QC / Hold · created',
    channels: ['in-app', 'email'],
    recipients: 'Quality team',
    enabled: true,
  },
  {
    id: 'rule_fefo',
    name: 'FEFO breach advisory',
    trigger: 'Dispatch · FEFO violation',
    channels: ['in-app'],
    recipients: 'Dispatch operators',
    enabled: true,
  },
  {
    id: 'rule_receive',
    name: 'Dispatch received',
    trigger: 'Receive · confirmed',
    channels: ['email', 'webhook'],
    recipients: 'Logistics, ERP webhook',
    enabled: false,
  },
  {
    id: 'rule_promo',
    name: 'Field promotion request',
    trigger: 'Approval · submitted',
    channels: ['in-app', 'email'],
    recipients: 'Super Admin queue',
    enabled: true,
  },
];

export type LogStatus = 'delivered' | 'pending' | 'failed';

export interface DeliveryEntry {
  id: string;
  time: string;
  rule: string;
  channel: Channel;
  recipient: string;
  status: LogStatus;
}

export const deliveryLog: DeliveryEntry[] = [
  {
    id: 'log_1',
    time: '09:42 · today',
    rule: 'Recall fan-out',
    channel: 'webhook',
    recipient: 'erp.acme.in/hooks/recall',
    status: 'delivered',
  },
  {
    id: 'log_2',
    time: '09:42 · today',
    rule: 'Recall fan-out',
    channel: 'email',
    recipient: 'metro-foods@dealer.in',
    status: 'delivered',
  },
  {
    id: 'log_3',
    time: '09:41 · today',
    rule: 'Recall fan-out',
    channel: 'email',
    recipient: 'sunrise-dist@dealer.in',
    status: 'pending',
  },
  {
    id: 'log_4',
    time: '08:17 · today',
    rule: 'QC hold raised',
    channel: 'in-app',
    recipient: 'quality@acme.in',
    status: 'delivered',
  },
  {
    id: 'log_5',
    time: 'Yesterday · 18:05',
    rule: 'FEFO breach advisory',
    channel: 'in-app',
    recipient: 'dispatch@acme.in',
    status: 'delivered',
  },
  {
    id: 'log_6',
    time: 'Yesterday · 16:30',
    rule: 'Dispatch received',
    channel: 'webhook',
    recipient: 'erp.acme.in/hooks/receive',
    status: 'failed',
  },
];
