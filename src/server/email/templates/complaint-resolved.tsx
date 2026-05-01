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
};

export function ComplaintResolvedEmail({ userName, complaintTitle, complaintId }: Props) {
  const complaintUrl = `${APP_URL}/dashboard/complaints/${complaintId}`;

  return (
    <Html>
      <Head />
      <Preview>Your complaint has been resolved — JotaComplaint</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ color: "#16a34a", fontSize: "24px" }}>
            Complaint Resolved 🎉
          </Heading>
          <Text style={{ color: "#555", fontSize: "16px" }}>Hi {userName},</Text>
          <Text style={{ color: "#555", fontSize: "16px" }}>
            Great news! Your complaint has been resolved by our team.
          </Text>
          <Section style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "16px", margin: "24px 0" }}>
            <Text style={{ margin: "4px 0", color: "#15803d", fontWeight: "bold" }}>{complaintTitle}</Text>
            <Text style={{ margin: "4px 0", color: "#16a34a", fontSize: "14px" }}>Status: Resolved ✓</Text>
          </Section>
          <Text style={{ color: "#555", fontSize: "14px" }}>
            If you feel the issue has not been fully resolved, you can reopen it or submit a new complaint.
          </Text>
          <Button href={complaintUrl} style={{ backgroundColor: "#16a34a", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
            View Resolution
          </Button>
          <Text style={{ color: "#999", fontSize: "12px", marginTop: "32px" }}>
            JotaComplaint — Citizen Grievance Management System
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ComplaintResolvedEmail;
