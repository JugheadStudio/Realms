"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, getDocs, getDoc } from "firebase/firestore";  // <-- Add this import
import { Container, Row, Col, Button, ListGroup, Modal, Form } from "react-bootstrap";
import { useAuth } from "../../../hooks/useAuth";
import axios from 'axios';

export default function Lobby({ params }) {
  const [roomData, setRoomData] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterType, setCharacterType] = useState("");
  const [characterBackstory, setCharacterBackstory] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState()
  const [friends, setFriends] = useState([]);
  const [friendDetails, setFriendDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch room data
  useEffect(() => {
    const roomRef = doc(db, "rooms", params.roomCode);

    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoomData({ id: doc.id, ...doc.data() });
      } else {
        console.log("Room not found!");
      }
    });

    return () => unsubscribe();
  }, [params.roomCode]);

  useEffect(() => {
    if (roomData && user) {
      const currentPlayer = roomData.players.find((player) => player.userId === user.uid);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady);
      }
    }
  }, [roomData, user]);

  const handleReadyToggle = async () => {
    const updatedReadyState = !isReady;

    const updatedPlayers = roomData.players.map((player) =>
      player.userId === user.uid ? { ...player, isReady: updatedReadyState } : player
    );

    try {
      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
      });
      setIsReady(updatedReadyState);
    } catch (error) {
      console.error("Error updating readiness:", error);
    }
  };

  // Add player to room when they join
  useEffect(() => {
    if (user && roomData && !roomData.players.some((player) => player.userId === user.uid)) {
      const fetchAndAddPlayer = async () => {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        const username = userDoc.exists() ? userDoc.data().username : "Guest";

        const updatedPlayers = [
          ...roomData.players,
          { userId: user.uid, username, characterName: null, characterType: null, isReady: false },
        ];

        await updateDoc(doc(db, "rooms", roomData.id), {
          players: updatedPlayers,
        });
      };

      fetchAndAddPlayer();
    }
  }, [user, roomData]);

  // Check if all players are ready
  const allPlayersReady = roomData && roomData.players.every(player => player.isReady);

  const handleStartAdventure = async () => {
    if (!roomData) return;

    try {
      setLoading(true);

      // Generate the intro message
      const playerDetails = roomData.players
        .map(player => `${player.username} (Character: ${player.characterName}, Class: ${player.characterType}, BackStory: ${player.characterBackstory})`)
        .join(", ");
      const prompt = `
        You are a creative dungeon master.
        The title of the adventure is: ${roomData.adventureTitle},
        Introduce the adventure for the following players:
        ${playerDetails}. 
        The adventure is set in: ${roomData.adventureSetting},
        Some Lore about the world: ${roomData.worldLore || 'Nothing specific.'},
        Context: ${roomData.context || 'No specific context.'},
        Plot Line: ${roomData.plot || 'No specific plot line.'},
      `;

      const response = await axios.post('/api/openai', { message: prompt });
      const introMessage = response.data.content;

      await updateDoc(doc(db, "rooms", roomData.id), {
        messages: arrayUnion({
          role: "system",
          content: introMessage,
          timestamp: new Date().toISOString()
        })
      });

      // After the intro message is added, update the players' status and set isStarted to true
      const updatedPlayers = roomData.players.map((player) => ({
        ...player,
        status: "inAdventure",
      }));

      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
        isStarted: true,
      });

      // Redirect to the room after the intro message and room update is done
      router.push(`/room/${params.roomCode}`);
    } catch (error) {
      console.error('Error starting the adventure:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomData) return;

    // console.log("Room Data:", roomData);

    const roomRef = doc(db, "rooms", roomData.id);

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      const room = snapshot.data();
      if (room.isStarted && roomData.id) {
        // console.log("Redirecting to room:", roomData.id);
        router.push(`/room/${roomData.id}`);
      }
    });

    return () => unsubscribe();
  }, [roomData, router]);

  const fetchFriends = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const friendsList = userSnap.data().friends || [];
        setFriends(friendsList);

        const friendPromises = friendsList.map(async (friendId) => {
          const friendRef = doc(db, "users", friendId);
          const friendSnap = await getDoc(friendRef);
          if (friendSnap.exists()) {
            return { id: friendId, ...friendSnap.data() };
          }
          return null;
        });

        const friendDetails = await Promise.all(friendPromises);
        setFriendDetails(friendDetails.filter(Boolean));
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showInviteModal) {
      fetchFriends();
    }
  }, [showInviteModal]);

  // Function to handle sending an invites to friends
  const handleSendInvite = async (friendId) => {
    try {
      const friendRef = doc(db, "users", friendId);
      await updateDoc(friendRef, {
        notifications: arrayUnion({
          type: "invite",
          roomCode: params.roomCode,
          fromUser: user.uid,
          timestamp: new Date().toISOString()
        })
      });
      console.log("Invite sent to", friendId);
    } catch (error) {
      console.error("Error sending invite:", error);
    }
  };

  const handleCharacterSetup = () => setShowCharacterModal(true);

  const handleCharacterSetupClose = () => setShowCharacterModal(false);

  const handleInviteClose = () => setShowInviteModal(false);

  const handleCharacterSubmit = async (e) => {
    e.preventDefault();

    if (!characterName || !characterType) {
      alert("Please fill in all required fields.");
      return;
    }

    const playerCharacter = {
      characterName,
      characterType,
      characterBackstory,
    };

    const updatedPlayers = roomData.players.map((player) =>
      player.userId === user.uid ? { ...player, ...playerCharacter } : player
    );

    try {
      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
      });
      handleCharacterSetupClose();
    } catch (error) {
      console.error("Error saving character:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(params.roomCode).then(() => {
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center text-white">
        <Col xs={4}>
          <div className="lobby-card">
            {roomData ? (
              <>
                <div className="lobby-now-playing">
                  <p>Now <strong>Playing</strong></p>
                  <h3>{roomData.adventureTitle}</h3>
                </div>

                <div className="lobby-code">
                  <div>
                    <p>Room <strong>Code</strong>
                      {copied && (
                        <span style={{marginLeft: "8px", color: "black",}}>
                          Code Copied!
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <div className="roomcode" onClick={handleCopy} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }} >
                      {params.roomCode.split("").map((char, index) => (
                        <span key={index}>{char}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <ListGroup>
                    {roomData.players.map((player) => (
                      <ListGroup.Item key={player.userId} className="d-flex justify-content-between">
                        <span>
                          {player.username || "Loading..."}
                          {player.userId === roomData.hostUid && " (Host)"}
                        </span>
                        <span className={player.isReady ? "text-success" : "text-danger"}>
                          {player.isReady ? "Ready" : "Not Ready"}
                        </span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  <div className="mt-20">
                    <Button variant="info" className="w-100" onClick={() => setShowInviteModal(true)}>
                      Invite Friend
                    </Button>
                  </div>

                  <div className="mt-20">
                    <Button variant="secondary" className="w-100" onClick={handleCharacterSetup}>
                      Setup Character
                    </Button>
                  </div>

                  <div className="mt-20">
                    <Button variant={isReady ? "warning" : "success"} className="w-100" onClick={handleReadyToggle}>
                      {isReady ? "Unready" : "Ready"}
                    </Button>
                  </div>

                  {roomData.hostUid === user.uid && (
                    <div className="mt-20">
                      {loading ? (
                        <Button variant="primary" className="w-100" disabled>
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="spinner-border text-light me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Loading...
                          </div>
                        </Button>
                      ) : (
                        <Button variant="start" className="w-100" onClick={handleStartAdventure} disabled={!allPlayersReady}>
                          Start Adventure
                        </Button>
                      )}
                    </div>
                  )}

                </div>
              </>
            ) : (
              <p>Loading room data...</p>
            )}
          </div>
        </Col>
      </Row>

      {/* Character Setup Modal */}
      <Modal show={showCharacterModal} onHide={handleCharacterSetupClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Character Setup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCharacterSubmit}>
            <Form.Group controlId="characterName">
              <Form.Label>Character Name</Form.Label>
              <Form.Control type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} required />
            </Form.Group>

            <Form.Group controlId="characterType">
              <Form.Label>Character Type</Form.Label>
              <Form.Control type="text" value={characterType} onChange={(e) => setCharacterType(e.target.value)} required />
            </Form.Group>

            <Form.Group controlId="characterBackstory">
              <Form.Label>Backstory (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} value={characterBackstory} onChange={(e) => setCharacterBackstory(e.target.value)} />
            </Form.Group>

            <div className="mt-20 d-flex justify-content-end">
              <Button variant="secondary" className="mr-5" onClick={handleCharacterSetupClose}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                Save Character
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Friend Invite Modal */}
      <Modal show={showInviteModal} onHide={handleInviteClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite a Friend</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <p>Loading friends...</p>
          ) : friends.length === 0 ? (
            <p>No friends yet</p>
          ) : (
            <ListGroup>
              {friendDetails.map((friend) => (
                <ListGroup.Item key={friend.id} className="d-flex justify-content-between">
                  {friend.username}
                  <Button onClick={() => handleSendInvite(friend.id)}>Send Invite</Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          <div className="mt-20 d-flex justify-content-end">
            <Button variant="secondary" onClick={handleInviteClose}>
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>

    </Container>
  );
}
