package com.example.wifipc;

import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "WiFiPC";
    private static final String DRONE_IP = "192.168.169.1";
    private static final int DRONE_PORT = 8800;

    private TextView resultTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);

        Button activateButton = new Button(this);
        activateButton.setText("드론 활성화 및 자이로 초기화");
        layout.addView(activateButton);

        ScrollView scrollView = new ScrollView(this);
        resultTextView = new TextView(this);
        scrollView.addView(resultTextView);
        layout.addView(scrollView);

        setContentView(layout);

        activateButton.setOnClickListener(v -> new Thread(this::sendFullActivationFlow).start());
    }

    private void sendFullActivationFlow() {
        try {
            InetAddress address = InetAddress.getByName(DRONE_IP);
            DatagramSocket socket = new DatagramSocket();
            socket.connect(address, DRONE_PORT);

            // 1. 초기화 패킷 전송
            byte[] initPacket = new byte[]{(byte) 0xAA, 0x00, 0x00, 0x00, 0x55};
            socket.send(new DatagramPacket(initPacket, initPacket.length));
            logHex("초기화 패킷 전송", initPacket);

            Thread.sleep(100);

            // 2. 활성화 명령어 전송
            byte[] base = new byte[]{(byte) 0xEF, 0x01, 0x00, 0x04, 0x00, 0x00};
            byte[] crc = calculateCRC16(base);
            byte[] command = new byte[8];
            System.arraycopy(base, 0, command, 0, base.length);
            command[6] = crc[0];
            command[7] = crc[1];

            socket.send(new DatagramPacket(command, command.length));
            logHex("활성화 명령 송신", command);

            Thread.sleep(100);

            // 3. 자이로 초기화 명령 전송
            byte[] gyroCommand = getGyroResetPacket();
            socket.send(new DatagramPacket(gyroCommand, gyroCommand.length));
            logHex("자이로 초기화 명령어 전송", gyroCommand);

            socket.close();

        } catch (Exception e) {
            Log.e(TAG, "활성화 플로우 실패", e);
            appendResult("❌ 플로우 실패: " + e.getMessage() + "\n");
        }
    }

    private byte[] getGyroResetPacket() {
        return new byte[]{
                (byte) 0xEF, 0x02, 0x7C, 0x02,
                0x01, 0x20, 0x00, 0x20,
                0x01, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x32, 0x4B,
                0x14, 0x20, 0x50, 0x0E,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x5B, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
                0x5C, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x10, 0x00, 0x02, 0x21
        };
    }

    private byte[] calculateCRC16(byte[] data) {
        int crc = 0xFFFF;
        for (byte b : data) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                if ((crc & 0x8000) != 0)
                    crc = (crc << 1) ^ 0x1021;
                else
                    crc <<= 1;
                crc &= 0xFFFF;
            }
        }
        return new byte[]{(byte) ((crc >> 8) & 0xFF), (byte) (crc & 0xFF)};
    }

    private void logHex(String label, byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (byte b : data) sb.append(String.format("%02X ", b));
        String output = label + ": " + sb.toString().trim();
        Log.d(TAG, output);
        appendResult(output + "\n");
    }

    private void appendResult(String msg) {
        runOnUiThread(() -> resultTextView.append(msg));
    }
}
