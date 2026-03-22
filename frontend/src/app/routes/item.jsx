import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  books,
  audios,
  videos,
  equipments,
  borrows,
  holds,
  studentUsers,
  itemType,
  userType,
} from "@/data/dummy-data"

export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Extract item type from query param if available or default to search all
  // to find matching item by its specific ID since they share different scopes.
  const searchParams = new URLSearchParams(window.location.search)
  const itemTypeParam = searchParams.get("type")

  let book = null
  if (itemTypeParam === "audiobook") {
    book = audios.find((a) => a.audio_id === parseInt(id, 10))
  } else if (itemTypeParam === "video") {
    book = videos.find((v) => v.video_id === parseInt(id, 10))
  } else if (itemTypeParam === "equipment") {
    book = equipments.find((e) => e.equipment_id === parseInt(id, 10))
  } else {
    book = books.find((b) => b.book_id === parseInt(id, 10))
  }

  // Formatting helpers based on missing standard field keys
  const getCreator = () =>
    book?.author || book?.director || book?.brand || "Unknown"
  const getTag = () => book?.genre || book?.category || "Misc"
  const getCopies = () => book?.books_in_stock ?? book?.copies_in_stock ?? 0

  // For demo, assume active user is the first student
  const activeUser = studentUsers[0]
  const isFaculty = false // Change according to user type logic if needed
  const borrowDuration = isFaculty ? 14 : 7 // days

  // Compute availability dynamically
  const activeBorrowsCount = borrows.filter(
    (b) => b.item_id === book?.item_id && b.return_date === null
  ).length
  const activeHoldsCount = holds.filter(
    (h) => h.item_id === book?.item_id && h.hold_status === "active"
  ).length

  let availability = "Available"
  if (book && activeBorrowsCount >= getCopies()) {
    availability = activeHoldsCount > 0 ? "Waitlist" : "Checked Out"
  }

  const handleAction = () => {
    if (availability === "Available") {
      // Simulate Borrow
      let typeCode = itemType.BOOK
      if (itemTypeParam === "audiobook") typeCode = itemType.AUDIO
      else if (itemTypeParam === "video") typeCode = itemType.VIDEO
      else if (itemTypeParam === "equipment")
        typeCode = itemType.RENTAL_EQUIPMENT

      const newBorrow = {
        borrow_transaction_id: borrows.length + 1,
        item_type_code: typeCode,
        item_id: book.item_id,
        borrower_type: isFaculty ? userType.FACULTY : userType.STUDENT,
        borrower_id: activeUser.user_id,
        checkout_date: new Date().toISOString(),
        due_date: new Date(
          Date.now() + borrowDuration * 24 * 60 * 60 * 1000
        ).toISOString(),
        return_date: null,
      }
      borrows.push(newBorrow)
      alert("Item successfully borrowed!")
    } else {
      // Simulate Hold
      const newHold = {
        hold_id: holds.length + 1,
        item_id: book.item_id,
        user_type: isFaculty ? userType.FACULTY : userType.STUDENT,
        user_id: activeUser.user_id,
        request_date: new Date().toISOString(),
        hold_status: "active",
        queue_position: activeHoldsCount + 1,
      }
      holds.push(newHold)
      alert("Hold placed successfully!")
    }
    navigate("/user-dashboard")
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <h2 className="text-2xl font-bold">Item not found</h2>
        <Button variant="link" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Thumbnail Section */}
        <div className="flex justify-center md:col-span-1">
          {book.thumbnail_image ? (
            <img
              src={book.thumbnail_image}
              alt={book.title}
              className="aspect-square h-auto w-full max-w-[250px] rounded-lg object-cover shadow-md"
            />
          ) : (
            <div
              className="flex aspect-square w-full max-w-[250px] items-center justify-center rounded-lg shadow-md"
              style={{ backgroundColor: book.coverColor || "#e2e8f0" }}
            >
              <div className="text-center text-white/70">
                <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                <span>No Image</span>
              </div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6 md:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge
                variant={availability === "Available" ? "default" : "secondary"}
              >
                {availability}
              </Badge>
              <span className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                {getTag()}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-lg text-muted-foreground">by {getCreator()}</p>
          </div>

          <Card>
            <CardHeader className="px-4 py-3 pb-2">
              <CardTitle className="text-lg text-primary">
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 px-4 pt-0 pb-4 text-sm sm:grid-cols-2">
              {book.publication && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Publication:
                  </span>
                  <p>{book.publication}</p>
                </div>
              )}
              {book.release_date ? (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Release Date:
                  </span>
                  <p>{new Date(book.release_date).toLocaleDateString()}</p>
                </div>
              ) : book.publication_date ? (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Publication Date:
                  </span>
                  <p>{new Date(book.publication_date).toLocaleDateString()}</p>
                </div>
              ) : null}
              {itemTypeParam === "audiobook" && book.narrator && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Narrator:
                  </span>
                  <p>{book.narrator}</p>
                </div>
              )}
              {(itemTypeParam === "audiobook" || itemTypeParam === "video") &&
                book.duration && (
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Duration:
                    </span>
                    <p>{book.duration} minutes</p>
                  </div>
                )}
              {itemTypeParam === "equipment" && book.model && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Model:
                  </span>
                  <p>{book.model}</p>
                </div>
              )}
              {itemTypeParam === "equipment" && book.serial_number && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Serial Number:
                  </span>
                  <p>{book.serial_number}</p>
                </div>
              )}
              {(!itemTypeParam || itemTypeParam === "book") && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Edition:
                  </span>
                  <p>{book.edition || "N/A"}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <span className="font-semibold text-muted-foreground">
                  Description:
                </span>
                <p className="mt-1">{book.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-slate-50 dark:bg-slate-900">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <div className="space-y-0.5 text-center sm:text-left">
                <h3 className="font-semibold">Borrowing Rules</h3>
                <p className="text-sm text-muted-foreground">
                  You can borrow this item for up to{" "}
                  <span className="font-medium text-foreground">
                    {borrowDuration} days
                  </span>
                  .
                </p>
                {availability !== "Available" && (
                  <p className="text-sm text-muted-foreground">
                    Current waitlist: {activeHoldsCount} people
                  </p>
                )}
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleAction}
              >
                {availability === "Available" ? "Borrow Item" : "Place Hold"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
