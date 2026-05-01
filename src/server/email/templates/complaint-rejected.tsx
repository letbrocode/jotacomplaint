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
  rejectionNote: string;
};

export function ComplaintRejectedEmail({ userName, complaintTitle, complaintId, rejectionNote }: Props) {
  const newComplaintUrl = `${APP_URL}/dashboard/new`;

  return (
    <Html>
      <Head />
      <Preview>Update on your complaint — JotaComplaint</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ color: "#dc2626", fontSize: "24px" }}>
            Complaint Update
          </Heading>
          <Text style={{ color: "#555", fontSize: "16px" }}>Hi {userName},</Text>
          <Text style={{ color: "#555", fontSize: "16px" }}>
            After review, we were unable to process your complaint.
          </Text>
          <Section style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "16px", margin: "24px 0" }}>
            <Text style={{ margin: "4px 0", color: "#333", fontWeight: "bold" }}>{complaintTitle}</Text>
            <Text style={{ margin: "8px 0 4px", color: "#666", fontSize: "14px", fontWeight: "bold" }}>Reason:</Text>
            <Text style={{ margin: "4px 0", color: "#555", fontSize: "14px" }}>{rejectionNote}</Text>
          </Section>
          <Text style={{ color: "#555", fontSize: "14px" }}>
            If you believe this is an error or have additional information, please submit a new complaint with more details.
          </Text>
          <Button href={newComplaintUrl} style={{ backgroundColor: "#6366f1", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
            Submit New Complaint
          </Button>
          <Text style={{ color: "#999", fontSize: "12px", marginTop: "32px" }}>
            JotaComplaint — Citizen Grievance Management System
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ComplaintRejectedEmail;
