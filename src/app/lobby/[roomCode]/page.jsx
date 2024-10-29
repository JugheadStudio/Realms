"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config"; 
import { doc, onSnapshot } from "firebase/firestore"; 
import { Container, Row, Col, Button } from "react-bootstrap";

export default function Lobby({ params }) {
  const [roomData, setRoomData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const roomRef = doc(db, "rooms", params.roomCode);

    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoomData({ id: doc.id, ...doc.data() });
      } else {
        console.log("No such document!");
      }
    });

    return () => unsubscribe();
  }, [params.roomCode]);

  const handleStartAdventure = async () => {
    if (!roomData) return;

    try {
      router.push(`/room/${roomData.id}`);
    } catch (error) {
      console.error("Error starting adventure:", error);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center text-white">
        <Col xs={6}>
          <h2 className="text-center">Pre-game Lobby</h2>

          {roomData ? (
            <div>
              <h3>Character: {roomData.characterName}</h3>
              <p>Type: {roomData.characterType}</p>
              <p>Setting: {roomData.adventureSetting}</p>
              <p>Context: {roomData.context}</p>

              <Button variant="success" onClick={handleStartAdventure} className="mt-3">
                Start Adventure
              </Button>
            </div>
          ) : (
            <p>Loading room data...</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}
