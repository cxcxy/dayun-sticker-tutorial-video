// 只录制指定窗口（ScreenCaptureKit），用法：winrec <windowID> <输出.mov> <停止标记文件>
// 停止标记文件出现后结束录制。窗口被遮挡时也能录到窗口本身的内容。
import AppKit
import AVFoundation
import CoreMedia
import Foundation
import ScreenCaptureKit

final class Recorder: NSObject, SCStreamOutput {
    let writer: AVAssetWriter
    let input: AVAssetWriterInput
    var started = false
    var frames = 0

    init(url: URL, width: Int, height: Int) throws {
        writer = try AVAssetWriter(outputURL: url, fileType: .mov)
        let settings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 40_000_000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            ],
        ]
        input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.expectsMediaDataInRealTime = true
        writer.add(input)
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer sb: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .screen, sb.isValid else { return }
        guard let arr = CMSampleBufferGetSampleAttachmentsArray(sb, createIfNecessary: false) as? [[SCStreamFrameInfo: Any]],
              let raw = arr.first?[.status] as? Int,
              let status = SCFrameStatus(rawValue: raw), status == .complete else { return }
        if !started {
            writer.startWriting()
            writer.startSession(atSourceTime: sb.presentationTimeStamp)
            started = true
            let t = Date().timeIntervalSince1970
            print("START_EPOCH \(t)")
            fflush(stdout)
        }
        if input.isReadyForMoreMediaData {
            input.append(sb)
            frames += 1
        }
    }
}

let args = CommandLine.arguments
guard args.count == 4, let wid = UInt32(args[1]) else {
    print("用法: winrec <windowID> <输出.mov> <停止标记文件>")
    exit(2)
}
let outURL = URL(fileURLWithPath: args[2])
let stopPath = args[3]
try? FileManager.default.removeItem(at: outURL)

_ = NSApplication.shared
let sema = DispatchSemaphore(value: 0)
Task {
    do {
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: false)
        guard let win = content.windows.first(where: { $0.windowID == wid }) else {
            print("找不到窗口 \(wid)")
            exit(3)
        }
        let scale = 2.0
        let w = Int(win.frame.width * scale) / 2 * 2
        let h = Int(win.frame.height * scale) / 2 * 2
        let filter = SCContentFilter(desktopIndependentWindow: win)
        let cfg = SCStreamConfiguration()
        cfg.width = w
        cfg.height = h
        cfg.minimumFrameInterval = CMTime(value: 1, timescale: 30)
        cfg.showsCursor = false
        cfg.pixelFormat = kCVPixelFormatType_32BGRA
        cfg.queueDepth = 8
        let rec = try Recorder(url: outURL, width: w, height: h)
        let stream = SCStream(filter: filter, configuration: cfg, delegate: nil)
        try stream.addStreamOutput(rec, type: .screen, sampleHandlerQueue: DispatchQueue(label: "rec"))
        try await stream.startCapture()
        print("RECORDING \(w)x\(h)")
        fflush(stdout)
        while !FileManager.default.fileExists(atPath: stopPath) {
            try await Task.sleep(nanoseconds: 200_000_000)
        }
        try await stream.stopCapture()
        rec.input.markAsFinished()
        await rec.writer.finishWriting()
        print("DONE frames=\(rec.frames)")
    } catch {
        print("ERROR \(error)")
        exit(1)
    }
    exit(0)
}
RunLoop.main.run()
