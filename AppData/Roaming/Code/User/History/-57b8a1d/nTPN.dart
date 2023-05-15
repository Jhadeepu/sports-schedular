import 'package:flutter/material.dart';

void main() => runApp(MyApp());

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

enum EmergencyStatus { none, sending, sent }

class _MyAppState extends State<MyApp> {
  EmergencyStatus _emergencyStatus = EmergencyStatus.none;
  bool _showVideo = false;

  String get buttonText {
    switch (_emergencyStatus) {
      case EmergencyStatus.none:
        return 'Send Emergency Notification';
      case EmergencyStatus.sending:
        return 'Sending...';
      case EmergencyStatus.sent:
        return 'Emergency Notification Sent';
      default:
        return '';
    }
  }

  void _sendEmergencyNotification() {
    setState(() {
      _emergencyStatus = EmergencyStatus.sending;
    });

    // Simulate sending the emergency notification
    Future.delayed(Duration(seconds: 2), () {
      setState(() {
        _emergencyStatus = EmergencyStatus.sent;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Emergency Notification',
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Emergency Notification'),
        ),
        drawer: Drawer(
          child: ListView(
            padding: EdgeInsets.zero,
            children: <Widget>[
              const DrawerHeader(
                decoration: BoxDecoration(
                  color: Colors.blue,
                ),
                child: Text(
                  'Sidebar',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.chat_bubble),
                title: const Text('Chatbot'),
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        title: const Text('Chatbot'),
                        content: SizedBox(
                          width: 300,
                          height: 100,
                          child: Column(
                            children: <Widget>[
                              const TextField(
                                decoration: InputDecoration(
                                  hintText: 'Enter your message',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 10),
                              ElevatedButton(
                                onPressed: () {
                                  // TODO: Implement send message functionality.
                                },
                                child: const Text('Send'),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
              ListTile(
                leading: Icon(Icons.call),
                // ignore: prefer_const_constructors
                title: Text('Call'),
                onTap: () {
                  // Implement the logic for making a call
                },
              ),
            ],
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              if (_showVideo)
                Container(
                  height: 200,
                  width: 200,
                  color: Colors.grey,
                  child: Center(
                    child: Text('Video Stream'),
                  ),
                ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _emergencyStatus == EmergencyStatus.none
                    ? _sendEmergencyNotification
                    : null,
                child: Text(buttonText),
                style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all(
                    Color(_emergencyStatus == EmergencyStatus.none ? 0xff8b0000 : 0xffc4c4c4),
                  ),
                ),
              ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _showVideo = !_showVideo;
                  });
                },
                child: Text(_showVideo ? 'Hide Video' : 'Show Video'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
