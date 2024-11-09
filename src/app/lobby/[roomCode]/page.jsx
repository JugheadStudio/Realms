"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, getDocs, getDoc } from "firebase/firestore";  // <-- Add this import
import { Container, Row, Col, Button, ListGroup, Modal, Form } from "react-bootstrap";
import { useAuth } from "../../../hooks/useAuth";

export default function Lobby({ params }) {
  const [roomData, setRoomData] = useState(null);
  const [isReady, setIsReady] = useState(false); // Local state for player's readiness
  const [showCharacterModal, setShowCharacterModal] = useState(false); // State for character setup modal
  const [characterName, setCharacterName] = useState("");
  const [characterType, setCharacterType] = useState("");
  const [characterBackstory, setCharacterBackstory] = useState("");
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

  // Sync local readiness state with room data on page load or when room data changes
  useEffect(() => {
    if (roomData && user) {
      const currentPlayer = roomData.players.find((player) => player.userId === user.uid);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady); // Sync with player's readiness from DB
      }
    }
  }, [roomData, user]);

  const handleReadyToggle = async () => {
    const updatedReadyState = !isReady; // Toggle the ready state

    // Update the readiness state in the database
    const updatedPlayers = roomData.players.map((player) =>
      player.userId === user.uid ? { ...player, isReady: updatedReadyState } : player
    );

    try {
      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
      });
      setIsReady(updatedReadyState); // Update local state for UI consistency
    } catch (error) {
      console.error("Error updating readiness:", error);
    }
  };

  // Add player to room when they join (if not already added)
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
      // Update all players to "inAdventure" status
      const updatedPlayers = roomData.players.map((player) => ({
        ...player,
        status: "inAdventure",
      }));

      // Update the room document in Firestore to indicate the adventure has started
      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
        isStarted: true,
      });

    } catch (error) {
      console.error("Error starting adventure:", error);
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

  const handleCharacterSetup = () => {
    setShowCharacterModal(true);
  };

  const handleCharacterSetupClose = () => {
    setShowCharacterModal(false);
  };

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
      handleCharacterSetupClose(); // Close the modal after submitting
    } catch (error) {
      console.error("Error saving character:", error);
    }
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

                <div className="lobby-setting">
                  <p>Adventure <strong>Setting</strong></p>
                  <h3>{roomData.adventureSetting}</h3>
                </div>

                <div className="lobby-code">
                  <div>
                    <p>Room <strong>Code</strong></p>
                  </div>
                  <div className="roomcode">
                    {params.roomCode.split("").map((char, index) => (
                      <span key={index}>{char}</span>
                    ))}
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
                      <Button variant="primary" className="w-100" onClick={handleStartAdventure} disabled={!allPlayersReady}>
                        Start Adventure
                      </Button>
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
      <Modal show={showCharacterModal} onHide={handleCharacterSetupClose}>
        <Modal.Header closeButton>
          <Modal.Title>Character Setup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCharacterSubmit}>
            <Form.Group controlId="characterName">
              <Form.Label>Character Name</Form.Label>
              <Form.Control
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="characterType">
              <Form.Label>Character Type</Form.Label>
              <Form.Control
                type="text"
                value={characterType}
                onChange={(e) => setCharacterType(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="characterBackstory">
              <Form.Label>Backstory (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={characterBackstory}
                onChange={(e) => setCharacterBackstory(e.target.value)}
              />
            </Form.Group>

            <div className="mt-3">
              <Button variant="secondary" onClick={handleCharacterSetupClose}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                Save Character
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
