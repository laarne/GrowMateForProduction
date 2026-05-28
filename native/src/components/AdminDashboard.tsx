import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { useAuth } from "../context/AuthContext";
import {
  approveListingReview,
  approveSellerApplication,
  getPendingListingReviews,
  getPendingSellerApplications,
  rejectListingReview,
  rejectSellerApplication,
  type PendingListingReview,
  type PendingSellerApplication,
} from "../services/admin";
import { getReportsForAdmin, updateReportStatus, type Report } from "../services/reports";
import { colors } from "../theme/colors";

type ActionKind = "seller" | "listing";

export function AdminDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PendingSellerApplication[]>([]);
  const [listings, setListings] = useState<PendingListingReview[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadReviews() {
    setIsLoading(true);
    setError(null);

    try {
      const [nextApplications, nextListings, nextReports] = await Promise.all([
        getPendingSellerApplications(),
        getPendingListingReviews(),
        getReportsForAdmin(),
      ]);
      setApplications(nextApplications);
      setListings(nextListings);
      setReports(nextReports.filter((r) => r.status === "open"));
    } catch (loadError) {
      const nextMessage = loadError instanceof Error ? loadError.message : "Unable to load admin reviews.";
      setError(nextMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function runAction(id: string, label: string, action: () => Promise<void>) {
    setActionId(id);
    setMessage(null);
    setError(null);

    try {
      await action();
      setMessage(label);
      await loadReviews();
    } catch (actionError) {
      const nextMessage = actionError instanceof Error ? actionError.message : "Admin action failed.";
      setError(nextMessage);
    } finally {
      setActionId(null);
    }
  }

  async function handleResolveReport(reportId: string, resolution: "resolved" | "dismissed") {
    setActionId(reportId);
    setMessage(null);
    setError(null);
    try {
      await updateReportStatus(reportId, resolution);
      setMessage(`Report ${resolution}.`);
      await loadReviews();
    } catch (err) {
      const nextMessage = err instanceof Error ? err.message : "Failed to update report status.";
      setError(nextMessage);
    } finally {
      setActionId(null);
    }
  }

  function renderActionButtons(kind: ActionKind, id: string, approve: () => Promise<void>, reject: () => Promise<void>) {
    return (
      <View style={styles.buttonRow}>
        <Button disabled={actionId === id} onPress={() => runAction(id, `${kind === "seller" ? "Seller" : "Listing"} approved.`, approve)}>
          Approve
        </Button>
        <Button disabled={actionId === id} variant="secondary" onPress={() => runAction(id, `${kind === "seller" ? "Seller" : "Listing"} rejected.`, reject)}>
          Reject
        </Button>
      </View>
    );
  }

  return (
    <Card tint="sage">
      <Text style={styles.title}>Admin Review</Text>
      <Text style={styles.body}>Approve sellers, approve listings, and resolve open content reports.</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryNumber}>{applications.length}</Text>
          <Text style={styles.summaryLabel}>Seller apps</Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryNumber}>{listings.length}</Text>
          <Text style={styles.summaryLabel}>Listings</Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryNumber}>{reports.length}</Text>
          <Text style={styles.summaryLabel}>Open Reports</Text>
        </View>
      </View>

      <Button variant="secondary" onPress={loadReviews}>
        Refresh reviews
      </Button>

      {isLoading && <ActivityIndicator color={colors.green} style={styles.loader} />}
      {message && <Text style={styles.success}>{message}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.divider} />
      <Text style={styles.subtitle}>Seller applications</Text>
      {!isLoading && applications.length === 0 && <Text style={styles.body}>No pending seller applications.</Text>}
      {!isLoading &&
        applications.map((application) => (
          <View key={application.id} style={styles.reviewItem}>
            <Text style={styles.itemTitle}>{application.shopName ?? "Seller application"}</Text>
            <Text style={styles.itemMeta}>
              {application.applicantName} - {application.applicantLocation ?? "No location"}
            </Text>
            {application.reason && <Text style={styles.body}>{application.reason}</Text>}
            <View style={styles.proofGrid}>
              {[
                ["ID front", application.idFrontUrl || application.proofPhotoUrl],
                ["ID back", application.idBackUrl],
                ["Selfie with ID", application.selfieWithIdUrl],
                ["Selfie with plant", application.selfieWithPlantUrl],
              ].map(([label, url]) => (
                <View key={label} style={[styles.proofPill, !url && styles.proofPillMissing]}>
                  <Text style={[styles.proofPillText, !url && styles.proofPillTextMissing]}>
                    {url ? "Uploaded" : "Missing"} · {label}
                  </Text>
                </View>
              ))}
            </View>
            {user &&
              renderActionButtons(
                "seller",
                application.id,
                () => approveSellerApplication(application, user.id),
                () => rejectSellerApplication(application, user.id),
              )}
          </View>
        ))}

      <View style={styles.divider} />
      <Text style={styles.subtitle}>Listing reviews</Text>
      {!isLoading && listings.length === 0 && <Text style={styles.body}>No listings waiting for review.</Text>}
      {!isLoading &&
        listings.map((listing) => (
          <View key={listing.id} style={styles.reviewItem}>
            <Text style={styles.itemTitle}>{listing.name}</Text>
            <Text style={styles.itemMeta}>
              {listing.sellerName} - PHP {listing.price.toLocaleString("en-PH")} - {listing.quantity} {listing.unit}
            </Text>
            <Text style={styles.itemMeta}>
              {listing.category} - {listing.location}
            </Text>
            {listing.description && <Text style={styles.body}>{listing.description}</Text>}
            {renderActionButtons(
              "listing",
              listing.id,
              () => approveListingReview(listing.id),
              () => rejectListingReview(listing.id),
            )}
          </View>
        ))}

      <View style={styles.divider} />
      <Text style={styles.subtitle}>Open Content Reports</Text>
      {!isLoading && reports.length === 0 && <Text style={styles.body}>No open content reports.</Text>}
      {!isLoading &&
        reports.map((report) => (
          <View key={report.id} style={styles.reviewItem}>
            <Text style={styles.itemTitle}>{report.reportedTargetName}</Text>
            <Text style={styles.itemMeta}>
              Reason: {report.reason} - Reporter: {report.reporterName}
            </Text>
            {report.details && <Text style={styles.body}>Details: {report.details}</Text>}
            <View style={styles.buttonRow}>
              <View style={styles.flexButton}>
                <Button disabled={actionId === report.id} onPress={() => handleResolveReport(report.id, "resolved")}>
                  Resolve
                </Button>
              </View>
              <View style={styles.flexButton}>
                <Button disabled={actionId === report.id} variant="secondary" onPress={() => handleResolveReport(report.id, "dismissed")}>
                  Dismiss
                </Button>
              </View>
            </View>
          </View>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.green,
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  body: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 14,
  },
  summaryPill: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  summaryNumber: {
    color: colors.green,
    fontSize: 22,
    fontWeight: "900",
  },
  summaryLabel: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  loader: {
    marginVertical: 12,
  },
  success: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 12,
  },
  error: {
    color: "#9f2d20",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 12,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: 18,
  },
  reviewItem: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  itemTitle: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  itemMeta: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  proofGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  proofPill: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  proofPillMissing: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  proofPillText: {
    color: "#166534",
    fontSize: 10,
    fontWeight: "900",
  },
  proofPillTextMissing: {
    color: "#9a3412",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  flexButton: {
    flex: 1,
  },
});
