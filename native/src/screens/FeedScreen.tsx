import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View, Modal, ScrollView } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { createFeedPost, getFeedPosts, getPostComments, addPostComment, togglePostReaction, deletePost, type FeedPost, type PostComment } from "../services/feed";
import { pickImageFromLibrary, uploadPublicImage, type PickedImage } from "../services/storage";
import { createReport } from "../services/reports";
import { colors } from "../theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const postTypes: FeedPost["type"][] = ["update", "question", "harvest", "tip"];

export function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [type, setType] = useState<FeedPost["type"]>("update");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comments states
  const [activePostComments, setActivePostComments] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});

  // Report and delete states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const reportReasons = ["Spam", "Scam / Fraud", "Inappropriate Content", "Offensive Language", "Other"];

  async function handleDeletePost(postId: string) {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.");
    }
  }

  async function handleOpenReportModal(postId: string) {
    setReportPostId(postId);
    setReportReason("Spam");
    setReportDetails("");
    setShowReportModal(true);
  }

  async function handleSubmitReport() {
    if (!user || !reportPostId) return;
    setIsReporting(true);
    try {
      await createReport({
        reporterId: user.id,
        postId: reportPostId,
        reason: reportReason,
        details: reportDetails,
      });
      setShowReportModal(false);
      setReportDetails("");
      setError("Thank you. Post has been reported to admins.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsReporting(false);
    }
  }

  async function loadPosts() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getFeedPosts(user?.id);
      setPosts(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load feed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [user?.id]);

  async function handlePost() {
    if (!user || !body.trim()) return;

    setIsPosting(true);
    setError(null);

    try {
      const uploadedPhoto = photo ? await uploadPublicImage("feed-photos", user.id, "posts", photo) : null;
      await createFeedPost(user.id, body.trim(), type, uploadedPhoto?.publicUrl);
      setBody("");
      setPhoto(null);
      setType("update");
      await loadPosts();
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : "Unable to create post.";
      setError(message);
    } finally {
      setIsPosting(false);
    }
  }

  async function handlePickPhoto() {
    setError(null);

    try {
      const pickedPhoto = await pickImageFromLibrary();
      if (pickedPhoto) {
        setPhoto(pickedPhoto);
      }
    } catch (photoError) {
      const message = photoError instanceof Error ? photoError.message : "Unable to choose feed photo.";
      setError(message);
    }
  }

  async function handleToggleLike(postId: string) {
    if (!user) return;

    // Optimistically update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const isLikedNow = !p.isLikedByMe;
          return {
            ...p,
            isLikedByMe: isLikedNow,
            reactionsCount: isLikedNow ? p.reactionsCount + 1 : Math.max(0, p.reactionsCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await togglePostReaction(postId, user.id);
    } catch (likeError) {
      // Revert if error
      loadPosts();
    }
  }

  async function handleToggleComments(postId: string) {
    if (activePostComments === postId) {
      setActivePostComments(null);
      return;
    }

    setActivePostComments(postId);
    setIsLoadingComments((prev) => ({ ...prev, [postId]: true }));

    try {
      const data = await getPostComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: data }));
    } catch (commentError) {
      // Silent error
    } finally {
      setIsLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleSubmitComment(postId: string) {
    if (!user) return;
    const text = newCommentTexts[postId]?.trim();
    if (!text) return;

    setNewCommentTexts((prev) => ({ ...prev, [postId]: "" }));

    try {
      const newComment = await addPostComment(postId, user.id, text);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );
    } catch (error) {
      // Silent error
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Feed</Text>
      <Card>
        <TextInput
          multiline
          onChangeText={setBody}
          placeholder="Share with the plant community..."
          placeholderTextColor="#8a9583"
          style={styles.composer}
          value={body}
        />
        {photo && <Image source={{ uri: photo.uri }} style={styles.preview} />}
        <View style={styles.actions}>
          {postTypes.map((postType) => (
            <Button key={postType} variant={type === postType ? "primary" : "secondary"} onPress={() => setType(postType)}>
              {postType}
            </Button>
          ))}
        </View>
        <View style={styles.buttonGap}>
          <Button variant="secondary" onPress={handlePickPhoto}>
            {photo ? "Change photo" : "Add photo"}
          </Button>
        </View>
        <View style={styles.buttonGap}>
          <Button disabled={isPosting || !body.trim()} onPress={handlePost}>
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </View>
      </Card>

      {error && (
        <Card tint="warning">
          <Text style={styles.emptyTitle}>Feed error</Text>
          <Text style={styles.body}>{error}</Text>
        </Card>
      )}

      {isLoading && (
        <Card>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.body}>Loading community posts...</Text>
        </Card>
      )}

      {!isLoading && posts.length === 0 && (
        <Card>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.body}>Garden updates, questions, harvests, and Leafy AI notes will appear here.</Text>
        </Card>
      )}

      {!isLoading &&
        posts.map((post) => (
          <Card key={post.id}>
            <View style={styles.postHeader}>
              <View style={styles.authorSection}>
                <View>
                  <Text style={styles.author}>{post.authorName}</Text>
                  <Text style={styles.meta}>
                    {post.authorLocation ?? "GrowMate"} - {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {post.userId === user?.id ? (
                  <Pressable onPress={() => handleDeletePost(post.id)} style={styles.actionIconPress}>
                    <MaterialCommunityIcons name="delete-outline" size={20} color="#d14b4b" />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => handleOpenReportModal(post.id)} style={styles.actionIconPress}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.green} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.tag}>{post.type}</Text>
            </View>
            {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
            {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}
            <Text style={styles.postBody}>{post.body}</Text>

            <View style={styles.reactionsBar}>
              <Pressable style={styles.actionBtn} onPress={() => handleToggleLike(post.id)}>
                <Text style={styles.actionBtnText}>
                  {post.isLikedByMe ? "❤️" : "🖤"} {post.reactionsCount} Likes
                </Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => handleToggleComments(post.id)}>
                <Text style={styles.actionBtnText}>
                  💬 {post.commentsCount} Comments
                </Text>
              </Pressable>
            </View>

            {activePostComments === post.id && (
              <View style={styles.commentsSection}>
                {isLoadingComments[post.id] ? (
                  <ActivityIndicator color={colors.green} size="small" style={styles.commentLoader} />
                ) : (
                  <>
                    {(commentsMap[post.id] ?? []).map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                        <Text style={styles.commentText}>{comment.body}</Text>
                      </View>
                    ))}
                    {(!commentsMap[post.id] || commentsMap[post.id].length === 0) && (
                      <Text style={styles.noComments}>No comments yet. Write the first one!</Text>
                    )}
                    <View style={styles.commentComposer}>
                      <TextInput
                        onChangeText={(val) => setNewCommentTexts((prev) => ({ ...prev, [post.id]: val }))}
                        placeholder="Write a comment..."
                        placeholderTextColor="#8a9583"
                        style={styles.commentInput}
                        value={newCommentTexts[post.id] || ""}
                      />
                      <Pressable
                        disabled={!(newCommentTexts[post.id] || "").trim()}
                        style={styles.commentSubmit}
                        onPress={() => handleSubmitComment(post.id)}
                      >
                        <Text style={styles.commentSubmitText}>Send</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}
          </Card>
        ))}

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Post</Text>
            <Text style={styles.modalLabel}>Select Reason:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reasonsContainer}>
              {reportReasons.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => setReportReason(reason)}
                  style={[styles.reasonChip, reportReason === reason && styles.reasonChipActive]}
                >
                  <Text style={[styles.reasonChipText, reportReason === reason && styles.reasonChipTextActive]}>
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Tell us details..."
              placeholderTextColor="#8a9583"
              multiline
              numberOfLines={4}
              value={reportDetails}
              onChangeText={setReportDetails}
            />

            <View style={styles.modalActions}>
              <View style={styles.flexButton}>
                <Button disabled={isReporting} onPress={handleSubmitReport}>
                  {isReporting ? "Reporting..." : "Submit"}
                </Button>
              </View>
              <View style={styles.flexButton}>
                <Button variant="secondary" onPress={() => setShowReportModal(false)}>
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.green,
    fontSize: 30,
    fontWeight: "900",
  },
  composer: {
    borderRadius: 24,
    backgroundColor: colors.cream,
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    minHeight: 92,
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  preview: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    height: 180,
    marginTop: 14,
    width: "100%",
  },
  buttonGap: {
    marginTop: 14,
  },
  emptyTitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
  },
  body: {
    marginTop: 8,
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  author: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  tag: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.green,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 7,
    textTransform: "capitalize",
  },
  postTitle: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 16,
  },
  postBody: {
    color: colors.greenMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 10,
  },
  postImage: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    height: 210,
    marginTop: 14,
    width: "100%",
  },
  reactionsBar: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
  },
  actionBtn: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionBtnText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900",
  },
  commentsSection: {
    backgroundColor: colors.cream,
    borderRadius: 18,
    marginTop: 14,
    padding: 12,
  },
  commentLoader: {
    marginVertical: 10,
  },
  commentItem: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  commentAuthor: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "900",
  },
  commentText: {
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  noComments: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "700",
    marginVertical: 10,
    textAlign: "center",
  },
  commentComposer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  commentInput: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.green,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentSubmit: {
    backgroundColor: colors.green,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  commentSubmitText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconPress: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.green,
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.greenMuted,
    marginBottom: 8,
  },
  reasonsContainer: {
    flexDirection: "row",
    marginBottom: 14,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.sage,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  reasonChipActive: {
    backgroundColor: colors.green,
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.green,
  },
  reasonChipTextActive: {
    color: colors.white,
  },
  modalInput: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
});
