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
  staffName: string;
  complaintTitle: string;
  complaintId: string;
  priority: string;
  category: string;
};

export function ComplaintAssignedEmail({ staffName, complaintTitle, complaintId, priority, category }: Props) {
  const complaintUrl = `${APP_URL}/staff/complaints/${complaintId}`;
  const priorityColor = priority === "HIGH" ? "#ef4444" : priority === "MEDIUM" ? "#f59e0b" : "#3b82f6";

  return (
    <Html>
      <Head />
      <Preview>New complaint assigned to you — JotaComplaint</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ color: "#1a1a2e", fontSize: "24px", marginBottom: "8px" }}>
            New Assignment 📋
          </Heading>
          <Text style={{ color: "#555", fontSize: "16px" }}>
            Hi {staffName},
          </Text>
          <Text style={{ color: "#555", fontSize: "16px" }}>
            A complaint has been assigned to you. Please review and take action.
          </Text>
          <Section style={{ backgroundColor: "#f4f4f5", borderRadius: "6px", padding: "16px", margin: "24px 0" }}>
            <Text style={{ margin: "4px 0", color: "#333", fontWeight: "bold" }}>{complaintTitle}</Text>
            <Text style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>Category: {category}</Text>
            <Text style={{ margin: "4px 0", fontSize: "14px", color: priorityColor, fontWeight: "bold" }}>
              Priority: {priority}
            </Text>
          </Section>
          <Button href={complaintUrl} style={{ backgroundColor: "#6366f1", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
            View Complaint
          </Button>
          <Text style={{ color: "#999", fontSize: "12px", marginTop: "32px" }}>
            JotaComplaint — Citizen Grievance Management System
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ComplaintAssignedEmail;
