import { useState, useEffect } from "react";
import { Modal, Button, Form, ListGroup } from "react-bootstrap";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, limit } from "firebase/firestore";

const FriendsModal = ({ show, onHide, userId }) => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId) {
        console.error("No userId provided");
        return;
      }

      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userFriends = userData?.friends || []; // Ensure friends field exists and is an array
          setFriends(userFriends);
        } else {
          console.error("User document not found");
          setFriends([]);
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    if (show && userId) fetchFriends();
  }, [userId, show]);

  const handleSearch = async (e) => {
    const search = e.target.value.toLowerCase(); // Convert search query to lowercase
    setSearchQuery(search); // Update the search query state

    if (search.length < 3) {
      setSearchResults([]); // Clear results if search is too short
      return;
    }

    try {
      // Firestore query to fetch all users
      const querySnapshot = await getDocs(collection(db, "users"));

      // Filter users client-side by comparing lowercase usernames
      const results = querySnapshot.docs
        .map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.username.toLowerCase().includes(search)); // Compare lowercased usernames

      setSearchResults(results);
      console.log(results);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]); // Clear results in case of an error
    }
  };

	const handleAddFriend = async (friendUid) => {
		console.log("Current userId:", userId);  // Check if userId is available
		if (!userId) {
			console.error("No userId provided");
			return;
		}
	
		try {
			// Get the current user's document
			const userDocRef = doc(db, "users", userId);
			
			// Update the user's friends array by adding the friend's UID
			await updateDoc(userDocRef, {
				friends: arrayUnion(friendUid), // Add the UID to the friends array (avoids duplicates)
			});
	
			console.log("Friend added:", friendUid);
			// Optionally, you can update the friends state to reflect the added friend
			setFriends((prevFriends) => [...prevFriends, friendUid]);
		} catch (error) {
			console.error("Error adding friend:", error);
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
              <ListGroup.Item key={friendId}>
                Friend UID: {friendId} {/* Update with fetched friend's info */}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <Form className="mt-3">
          <Form.Control
            type="text"
            placeholder="Search users by username"
            value={searchQuery}
            onChange={handleSearch} // Trigger the search function when typing
          />
        </Form>

        {searchResults.length > 0 && (
          <ListGroup className="mt-3">
            {searchResults.map((user) => (
              <ListGroup.Item key={user.uid} className="d-flex justify-content-between">
                <span>{user.username}</span>
                <Button
                  variant="link"
                  onClick={() => console.log("View Profile", user.uid)}
                >
                  View Profile
                </Button>
                <Button
                  variant="link"
                  onClick={() => handleAddFriend(user.uid)} // Add friend when clicked
                >
                  Add Friend
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
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
