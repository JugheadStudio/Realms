import { useState, useEffect } from "react";
import { Modal, Button, Form, ListGroup } from "react-bootstrap";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from "firebase/firestore";

const FriendsModal = ({ show, onHide, userId }) => {
	const [friends, setFriends] = useState([]);
	const [username, setUsername] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchUserData = async () => {
			if (!userId) return;
			const userDoc = await getDoc(doc(db, "users", userId));
			if (userDoc.exists()) {
				setUsername(userDoc.data().username);
				setFriends(userDoc.data().friends || []);
			}
		};

		if (show && userId) {
			setLoading(true);
			fetchUserData().finally(() => setLoading(false));
		}
	}, [userId, show]);

	const handleSearch = async (e) => {
		const search = e.target.value.toLowerCase();
		setSearchQuery(search);

		if (search.length < 3) {
			setSearchResults([]);
			return;
		}

		try {
			const querySnapshot = await getDocs(collection(db, "users"));
			const results = querySnapshot.docs
				.map((doc) => ({ uid: doc.id, ...doc.data() }))
				.filter((user) => user.username.toLowerCase().includes(search));

			setSearchResults(results);
		} catch (error) {
			console.error("Error searching users:", error);
			setSearchResults([]);
		}
	};

	const handleAddFriend = async (receiverId, receiverUsername) => {
		try {
			const senderDocRef = doc(db, "users", userId);
			const receiverDocRef = doc(db, "users", receiverId);

			const senderDoc = await getDoc(senderDocRef);
			const receiverDoc = await getDoc(receiverDocRef);

			if (!senderDoc.exists() || !receiverDoc.exists()) return;

			const existingRequest = senderDoc.data().friendRequests?.some(
				(request) => request.receiverId === receiverId && request.status === "pending"
			);
			if (existingRequest) return;

			const alreadyFriends = senderDoc.data().friends?.includes(receiverId);
			if (alreadyFriends) return;

			const newRequest = {
				senderId: userId,
				senderUsername: username,
				receiverId,
				receiverUsername,
				status: "pending",
			};

			await updateDoc(senderDocRef, { friendRequests: arrayUnion(newRequest) });
			await updateDoc(receiverDocRef, { friendRequests: arrayUnion(newRequest) });

			// Update searchResults to reflect request status
			setSearchResults((prevResults) =>
				prevResults.map((result) =>
					result.uid === receiverId ? { ...result, requestSent: true } : result
				)
			);

			alert("Friend request sent!");
		} catch (error) {
			console.error("Error sending friend request:", error);
			alert("Failed to send friend request.");
		}
	};

	return (
		<Modal show={show} onHide={onHide} centered>
			<Modal.Header closeButton>
				<Modal.Title>Friends</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{loading ? (
					<p>Loading friends...</p>
				) : friends.length === 0 ? (
					<p>No friends yet</p>
				) : (
					<ListGroup>
						{friends.map((friendId) => (
							<ListGroup.Item key={friendId}>Friend UID: {friendId}</ListGroup.Item>
						))}
					</ListGroup>
				)}

				<Form className="mt-3">
					<Form.Control
						type="text"
						placeholder="Search users by username"
						value={searchQuery}
						onChange={handleSearch}
					/>
				</Form>

				{searchResults.length > 0 ? (
					searchResults.map((result) => (
						<ListGroup.Item key={result.uid} className="d-flex justify-content-between">
							<span>{result.username}</span>
							<Button variant="link" onClick={() => console.log("View Profile", result.uid)}>
								View Profile
							</Button>
							<Button
								variant="link"
								onClick={() => handleAddFriend(result.uid, result.username)}
							>
								Add Friend
							</Button>
						</ListGroup.Item>
					))
				) : (
					// Display message when no search results are found and searchQuery has at least 3 characters
					searchQuery.length >= 3 && (
						<p>No users found matching "{searchQuery}"</p>
					)
				)}
			</Modal.Body>

			<Modal.Footer>
				<Button variant="secondary" onClick={onHide}>
					Close
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default FriendsModal;
