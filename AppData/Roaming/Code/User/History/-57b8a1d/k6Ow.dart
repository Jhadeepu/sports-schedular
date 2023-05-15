import 'package:flutter/material.dart';

void main() => runApp(MyApp());

// ignore: use_key_in_widget_constructors
class MyApp extends StatefulWidget {
  @override
  // ignore: library_private_types_in_public_api
  _MyAppState createState() => _MyAppState();
}

enum EmergencyStatus { none, sending, sent }

class _MyAppState extends State<MyApp> {
  final EmergencyStatus _emergencyStatus = EmergencyStatus.none;



  @override
  Widget build(BuildContext context) {

    switch (_emergencyStatus) {
      case EmergencyStatus.none:
        break;
      case EmergencyStatus.sending:
        break;
      case EmergencyStatus.sent:
        break;
    }

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
                                  // ignore: todo
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