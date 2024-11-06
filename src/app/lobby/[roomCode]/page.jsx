"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, getDocs, getDoc } from "firebase/firestore";
import { Container, Row, Col, Button, ListGroup, Modal, Form } from "react-bootstrap";
import { useAuth } from "../../../hooks/useAuth";

export default function Lobby({ params }) {
  const [roomData, setRoomData] = useState(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterType, setCharacterType] = useState("");
  const [characterBackstory, setCharacterBackstory] = useState("");
  const [isReady, setIsReady] = useState(false);
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

  const handleStartAdventure = async () => {
    if (!roomData) return;

    try {
      await updateDoc(doc(db, "rooms", roomData.id), {
        // Handle any pre-start actions here
      });
      router.push(`/room/${roomData.id}`);
    } catch (error) {
      console.error("Error starting adventure:", error);
    }
  };

  const handleCharacterSetup = async () => {
    if (!characterName || !characterType) {
      alert("Please fill in all character details.");
      return;
    }

    const updatedPlayers = roomData.players.map((player) =>
      player.userId === user.uid
        ? {
            ...player,
            characterName,
            characterType,
            characterBackstory,
            isReady: false,
          }
        : player
    );

    try {
      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
      });
      setShowCharacterModal(false);
    } catch (error) {
      console.error("Error setting up character:", error);
    }
  };

  const handleReady = async () => {
    const updatedPlayers = roomData.players.map((player) =>
      player.userId === user.uid
        ? { ...player, isReady: true }
        : player
    );

    try {
      await updateDoc(doc(db, "rooms", roomData.id), {
        players: updatedPlayers,
      });
      setIsReady(true); // Set local isReady state to true
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

  return (
    <Container className="mt-5">
      <Row className="justify-content-center text-white">
        <Col xs={6}>
          <h2 className="text-center">Pre-game Lobby</h2>

          {roomData ? (
            <div>
              <h3>{roomData.adventureTitle}</h3>
              <p>Room Code: {params.roomCode}</p>
              <p>Setting: {roomData.adventureSetting}</p>

              <h4>Players in Lobby:</h4>
              <ListGroup>
                {roomData.players.map((player) => (
                  <ListGroup.Item key={player.userId}>
                    {player.username || "Loading..."}
                    {player.userId === roomData.hostUid && " (Host)"}
                    {player.userId !== roomData.hostUid && (
                      player.isReady ? " - Ready" : " - Not Ready"
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="mt-3">
                {roomData.hostUid === user.uid ? (
                  <>
                    {!isReady && (
                      <Button
                        variant="secondary"
                        onClick={handleReady}
                        disabled={isReady}
                      >
                        Ready
                      </Button>
                    )}
                    <Button
                      variant="success"
                      onClick={handleStartAdventure}
                      disabled={!allPlayersReady}
                    >
                      Start Adventure
                    </Button>
                  </>
                ) : (
                  <Button
                    variant={isReady ? "success" : "secondary"}
                    onClick={isReady ? null : handleReady}
                    disabled={isReady}
                  >
                    {isReady ? "Ready" : "Not Ready"}
                  </Button>
                )}
              </div>

              <Button
                variant="info"
                onClick={() => setShowCharacterModal(true)}
                className="mt-3"
              >
                Create Character
              </Button>
            </div>
          ) : (
            <p>Loading room data...</p>
          )}

          <Modal show={showCharacterModal} onHide={() => setShowCharacterModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Character Setup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
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
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCharacterModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleCharacterSetup}>
                Save Character
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
}
