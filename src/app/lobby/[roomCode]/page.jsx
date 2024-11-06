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

  // Check if all players are ready
  const allPlayersReady = roomData && roomData.players.every(player => player.isReady);

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

    // Update the player's data in the database
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
        <Col xs={6}>
          <h2 className="text-center">Pre-game Lobby</h2>

          {roomData ? (
            <div>
              {/* Display room code and adventure title */}
              <h3>{roomData.adventureTitle}</h3>
              <p>Room Code: {params.roomCode}</p>
              <p>Setting: {roomData.adventureSetting}</p>

              {/* List of players in the lobby */}
              <h4>Players in Lobby:</h4>
              <ListGroup>
                {roomData.players.map((player) => (
                  <ListGroup.Item key={player.userId}>
                    {player.username || "Loading..."} {/* Display the username from roomData */}
                    {player.userId === roomData.hostUid && " (Host)"}
                    {player.userId !== roomData.hostUid && (
                      player.isReady ? (
                        " - Ready"
                      ) : (
                        " - Not Ready"
                      )
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {/* Ready/Unready Button */}
              <div className="mt-3">
                <Button
                  variant={isReady ? "warning" : "success"} // Toggle button color
                  onClick={handleReadyToggle}
                >
                  {isReady ? "Unready" : "Ready"} {/* Toggle button text */}
                </Button>
              </div>

              {/* Start Adventure Button (Only for Host) */}
              {roomData.hostUid === user.uid && (
                <div className="mt-3">
                  <Button
                    variant="primary"
                    onClick={handleStartAdventure}
                    disabled={!allPlayersReady} // Disable if not all players are ready
                  >
                    Start Adventure
                  </Button>
                </div>
              )}

              {/* Character Setup Button (Only for Host or Player if needed) */}
              <div className="mt-3">
                <Button
                  variant="secondary"
                  onClick={handleCharacterSetup}
                >
                  Setup Character
                </Button>
              </div>

              {/* Character Setup Modal */}
              <Modal show={showCharacterModal} onHide={handleCharacterSetupClose}>
                <Modal.Header closeButton>
                  <Modal.Title>Character Setup</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <form onSubmit={handleCharacterSubmit}>
                    {/* Input fields for character setup */}
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
            </div>
          ) : (
            <p>Loading room data...</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}
