import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "../../components/ui/button"

export function RegisterForm() {
  const [username, setName] = useState("")
  const [password, setDescription] = useState("")
  const [note, setNote] = useState("");
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/register`, { username, password })
      alert("user register succesfull")
      navigate("/")
    } catch (error) {
      console.error("Error in register :", error)
      setNote("Please enter a unique username & password should have aleast 10 characters"); 
    }
  }

  const handleCancel = () => {
    navigate("/")
  }

  return (
    <div
      className="flex justify-center items-center min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div
        className="shadow-md border rounded-2xl p-6 w-full max-w-md"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          borderColor: "var(--border)",
        }}
      >
        <h1 className="text-3xl font-bold mt-10 mb-20 text-center">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={username}
              placeholder="Enter username"
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg p-2 focus:outline-none focus:ring-2"
              required
              style={{
                backgroundColor: "var(--input)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
          <div className="mb-5">
             <input
              type="text"
               value={password}
                placeholder="Enter password"
              onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg p-2 focus:outline-none focus:ring-2"
              required
              style={{
                backgroundColor: "var(--input)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
          <div className="flex gap-4 mt-10">
            <Button
              type="submit"
              className="flex-1"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                 cursor: "pointer",
              }}
            >
              Register
            </Button>
            <Button
              type="button"
              className="flex-1 border"
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--secondary-foreground)",
                borderColor: "var(--border)",
                 cursor: "pointer",
              }}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
       {/* ✅ Display the note */}
       {note && <p className="note m-1.5">{note}</p>}
      </div>
    </div>
  )
}
