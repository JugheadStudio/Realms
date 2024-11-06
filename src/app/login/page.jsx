"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase/config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { createUserProfile, isUsernameTaken } from "../utils/firebaseUsers";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [isSignup, setIsSignup] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		try {
			if (isSignup) {
				// Convert username to lowercase
				const lowercaseUsername = username.toLowerCase();

				// Check if username is already taken
				const usernameExists = await isUsernameTaken(lowercaseUsername);
				if (usernameExists) {
					setError("Username is already taken. Please choose another one.");
					return;
				}

				// Create user in Firebase Auth
				const userCredential = await createUserWithEmailAndPassword(auth, email, password);
				const user = userCredential.user;

				// Create user profile in Firestore
				await createUserProfile(user, lowercaseUsername);

				alert("Account created successfully!");
			} else {
				// Log in existing user
				await signInWithEmailAndPassword(auth, email, password);
				alert("Logged in successfully!");
			}

			// Redirect to home page
			router.push("/");
		} catch (error) {
			console.error("Authentication error:", error);
			setError(error.message);
		}
	};

	return (
		<Container className="mt-5">
			<Row className="justify-content-center text-white">
				<Col xs={4}>
					<h2 className="text-center">{isSignup ? "Sign Up" : "Log In"}</h2>

					{error && <Alert variant="danger">{error}</Alert>}

					<Form onSubmit={handleSubmit}>
						{isSignup && (
							<Form.Group className="mb-3" controlId="username">
								<Form.Label>Username</Form.Label>
								<Form.Control
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
								/>
							</Form.Group>
						)}

						<Form.Group className="mb-3" controlId="email">
							<Form.Label>Email address</Form.Label>
							<Form.Control
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</Form.Group>

						<Form.Group className="mb-3" controlId="password">
							<Form.Label>Password</Form.Label>
							<Form.Control
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</Form.Group>

						<Button variant="primary" type="submit" className="w-100">
							{isSignup ? "Sign Up" : "Log In"}
						</Button>

						<Button
							variant="link"
							className="w-100 mt-3"
							onClick={() => setIsSignup(!isSignup)}
						>
							{isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
						</Button>
					</Form>
				</Col>
			</Row>
		</Container>
	);
}
