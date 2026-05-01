import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { APP_URL } from "../client";

type Props = {
  userName: string;
  complaintTitle: string;
  complaintId: string;
  newStatus: string;
};

export function StatusUpdatedEmail({ userName, complaintTitle, complaintId, newStatus }: Props) {
  const complaintUrl = `${APP_URL}/dashboard/complaints/${complaintId}`;
  const statusLabel = newStatus.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Html>
      <Head />
      <Preview>Your complaint status has been updated — JotaComplaint</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ color: "#1a1a2e", fontSize: "24px" }}>
            Status Update 🔔
          </Heading>
          <Text style={{ color: "#555", fontSize: "16px" }}>Hi {userName},</Text>
          <Text style={{ color: "#555", fontSize: "16px" }}>
            The status of your complaint has been updated.
          </Text>
          <Section style={{ backgroundColor: "#f4f4f5", borderRadius: "6px", padding: "16px", margin: "24px 0" }}>
            <Text style={{ margin: "4px 0", color: "#333", fontWeight: "bold" }}>{complaintTitle}</Text>
            <Text style={{ margin: "4px 0", color: "#6366f1", fontWeight: "bold", fontSize: "14px" }}>
              New Status: {statusLabel}
            </Text>
          </Section>
          <Button href={complaintUrl} style={{ backgroundColor: "#6366f1", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
            View Details
          </Button>
          <Text style={{ color: "#999", fontSize: "12px", marginTop: "32px" }}>
            JotaComplaint — Citizen Grievance Management System
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default StatusUpdatedEmail;
