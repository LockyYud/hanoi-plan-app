"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, UserPlus, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface InviteData {
    inviterName: string
    inviterImage?: string
    inviterEmail: string
    inviteCode: string
}

export default function InvitePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session, status } = useSession()
    const code = params.code as string

    const [inviteData, setInviteData] = useState<InviteData | null>(null)
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Fetch invite data
    useEffect(() => {
        const fetchInviteData = async () => {
            try {
                const response = await fetch(`/api/friends/invite/info?code=${code}`)
                if (response.ok) {
                    const data = await response.json()
                    setInviteData(data)
                } else {
                    const error = await response.json()
                    setError(error.error || "Link lời mời không hợp lệ hoặc đã hết hạn")
                }
            } catch (err) {
                setError("Không thể tải thông tin lời mời")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        if (code) {
            fetchInviteData()
        }
    }, [code])

    const handleAccept = async () => {
        if (!session?.user) {
            // Redirect to signin with callback
            router.push(`/auth/signin?callbackUrl=/invite/${code}`)
            return
        }

        setAccepting(true)
        setError(null)

        try {
            const response = await fetch("/api/friends/invite/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: code })
            })

            if (response.ok) {
                setSuccess(true)
                // Redirect to home after 2 seconds
                setTimeout(() => {
                    router.push("/")
                }, 2000)
            } else {
                const error = await response.json()
                setError(error.error || "Không thể chấp nhận lời mời")
            }
        } catch (err) {
            setError("Đã xảy ra lỗi. Vui lòng thử lại")
            console.error(err)
        } finally {
            setAccepting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl">Thành công! 🎉</CardTitle>
                        <CardDescription>
                            Bạn và {inviteData?.inviterName} giờ đã là bạn bè!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        Đang chuyển về trang chủ...
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl">Oops!</CardTitle>
                        <CardDescription className="text-base">{error}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link href="/">
                            <Button variant="outline">Về trang chủ</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!inviteData) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={inviteData.inviterImage} alt={inviteData.inviterName} />
                            <AvatarFallback className="text-2xl">
                                {inviteData.inviterName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            {inviteData.inviterName} mời bạn kết bạn
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            Tham gia Hanoi Plan để chia sẻ địa điểm yêu thích với {inviteData.inviterName}!
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status === "unauthenticated" && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                Bạn cần đăng nhập để chấp nhận lời mời
                            </p>
                        </div>
                    )}

                    {status === "authenticated" && session?.user?.email === inviteData.inviterEmail && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                            <p className="text-sm text-yellow-900 dark:text-yellow-200">
                                ⚠️ Đây là link mời của bạn. Bạn không thể kết bạn với chính mình!
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    {status === "authenticated" && session?.user?.email !== inviteData.inviterEmail ? (
                        <Button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full h-12 text-lg"
                            size="lg"
                        >
                            {accepting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-5 w-5" />
                                    Chấp nhận lời mời
                                </>
                            )}
                        </Button>
                    ) : status === "unauthenticated" ? (
                        <Button
                            onClick={() => router.push(`/auth/signin?callbackUrl=/invite/${code}`)}
                            className="w-full h-12 text-lg"
                            size="lg"
                        >
                            Đăng nhập để tiếp tục
                        </Button>
                    ) : (
                        <Link href="/" className="w-full">
                            <Button variant="outline" className="w-full h-12 text-lg" size="lg">
                                Về trang chủ
                            </Button>
                        </Link>
                    )}

                    {status === "authenticated" && session?.user?.email !== inviteData.inviterEmail && (
                        <Link href="/" className="w-full">
                            <Button variant="ghost" className="w-full">
                                Từ chối
                            </Button>
                        </Link>
                    )}
                </CardFooter>

                <div className="px-6 pb-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        Mã mời: <code className="bg-muted px-2 py-1 rounded">{code}</code>
                    </p>
                </div>
            </Card>
        </div>
    )
}

