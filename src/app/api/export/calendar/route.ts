import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { itineraryId, stops, title, startDate } = body

        // Generate ICS calendar content
        const icsContent = generateICSContent({
            title: title || "Pinory Itinerary",
            stops,
            startDate,
        })

        return new NextResponse(icsContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/calendar',
                'Content-Disposition': `attachment; filename="${title || 'pinory'}.ics"`,
                'Cache-Control': 'no-cache',
            },
        })

    } catch (error) {
        console.error('Error generating calendar:', error)
        return NextResponse.json(
            { error: 'Failed to generate calendar' },
            { status: 500 }
        )
    }
}

function generateICSContent({ title, stops, startDate }: any): string {
    const now = new Date()
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Pinory//Pinory App//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${title}`,
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    ].join('\r\n')

    // Add timezone definition
    icsContent += '\r\n' + [
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Ho_Chi_Minh',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0700',
        'TZOFFSETTO:+0700',
        'TZNAME:+07',
        'END:STANDARD',
        'END:VTIMEZONE',
    ].join('\r\n')

    // Add events for each stop
    stops.forEach((stop: any, index: number) => {
        const startTime = new Date(`${startDate}T${stop.time.split(' - ')[0]}:00`)
        const endTime = new Date(`${startDate}T${stop.time.split(' - ')[1]}:00`)

        icsContent += '\r\n' + [
            'BEGIN:VEVENT',
            `UID:${stop.id}@pinory.app`,
            `DTSTAMP:${formatDate(now)}`,
            `DTSTART;TZID=Asia/Ho_Chi_Minh:${formatDate(startTime).replace('Z', '')}`,
            `DTEND;TZID=Asia/Ho_Chi_Minh:${formatDate(endTime).replace('Z', '')}`,
            `SUMMARY:${stop.name}`,
            `DESCRIPTION:${stop.description || ''}\\n\\nĐịa chỉ: ${stop.address}\\n\\nDanh mục: ${stop.category}`,
            `LOCATION:${stop.address}`,
            `GEO:${stop.lat};${stop.lng}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            `SEQUENCE:${index}`,
            'END:VEVENT',
        ].join('\r\n')
    })

    icsContent += '\r\nEND:VCALENDAR'

    return icsContent
}

