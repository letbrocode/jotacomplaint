import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Button,
} from "@react-email/components";
import { APP_URL } from "../client";

type Props = {
  adminName: string;
  weeklyTotal: number;
  weeklyResolved: number;
  currentPending: number;
  weeklyEscalated: number;
  resolutionRate: number;
};

export function WeeklyDigestEmail({
  adminName,
  weeklyTotal,
  weeklyResolved,
  currentPending,
  weeklyEscalated,
  resolutionRate,
}: Props) {
  const dashboardUrl = `${APP_URL}/admin`;

  return (
    <Html>
      <Head />
      <Preview>Your weekly JotaComplaint summary</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ color: "#1a1a2e", fontSize: "24px" }}>
            Weekly Report 📊
          </Heading>
          <Text style={{ color: "#555" }}>Hi {adminName}, here&apos;s your weekly summary:</Text>

          <Section style={{ margin: "24px 0" }}>
            <Row>
              <Column style={{ padding: "8px", textAlign: "center", backgroundColor: "#f4f4f5", borderRadius: "6px", marginRight: "8px" }}>
                <Text style={{ fontSize: "28px", fontWeight: "bold", color: "#6366f1", margin: 0 }}>{weeklyTotal}</Text>
                <Text style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>New This Week</Text>
              </Column>
              <Column style={{ padding: "8px", textAlign: "center", backgroundColor: "#f0fdf4", borderRadius: "6px", marginRight: "8px" }}>
                <Text style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a", margin: 0 }}>{weeklyResolved}</Text>
                <Text style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>Resolved</Text>
              </Column>
              <Column style={{ padding: "8px", textAlign: "center", backgroundColor: "#fef9ec", borderRadius: "6px", marginRight: "8px" }}>
                <Text style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706", margin: 0 }}>{currentPending}</Text>
                <Text style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>Still Pending</Text>
              </Column>
              <Column style={{ padding: "8px", textAlign: "center", backgroundColor: "#fff7ed", borderRadius: "6px" }}>
                <Text style={{ fontSize: "28px", fontWeight: "bold", color: "#ea580c", margin: 0 }}>{weeklyEscalated}</Text>
                <Text style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>Escalated</Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ backgroundColor: "#f4f4f5", borderRadius: "6px", padding: "16px", margin: "24px 0", textAlign: "center" as const }}>
            <Text style={{ fontSize: "32px", fontWeight: "bold", color: resolutionRate >= 70 ? "#16a34a" : "#d97706", margin: 0 }}>
              {resolutionRate}%
            </Text>
            <Text style={{ color: "#666", fontSize: "14px", margin: "4px 0 0" }}>Resolution Rate This Week</Text>
          </Section>

          <Button href={dashboardUrl} style={{ backgroundColor: "#6366f1", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
            Open Dashboard
          </Button>
          <Text style={{ color: "#999", fontSize: "12px", marginTop: "32px" }}>
            JotaComplaint — Citizen Grievance Management System
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyDigestEmail;
