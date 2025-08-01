if (typeof console === 'undefined') {
 (globalThis as any).console = {

    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };
}


import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';

type Task = {
  text: string;
  done: boolean;
  date: string;
  dueDate: string;
};

const STORAGE_KEY = 'TASKS';

const MyApp = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  

  
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Task[];
          setTasks(parsed);
        }
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    };
    loadTasks();
  }, []);

   useEffect(() => {
  const interval = setInterval(() => {
    setTasks([...tasks]); 
  }, 10000); 

  return () => clearInterval(interval); 
  }, [tasks]);
 
  const saveTasks = async (taskList: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      text: newTaskText,
      done: false,
      date: new Date().toISOString(),
      dueDate: dueDate?.toISOString() || '',
      
    };

    const scheduleDueNotification = (taskText: string, dueDate: Date) => {
  const notifyTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); 

  if (notifyTime > new Date()) {
    PushNotification.localNotificationSchedule({
      channelId: "due-task-channel",
      message: `Task "${taskText}" is due tomorrow!`, 
      date: notifyTime,
      allowWhileIdle: true,
    });
  }
}



    setTasks(prev => {
      const updated = [...prev, newTask];
      updated.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      saveTasks(updated); // Save to storage
      return updated;
    });

    setNewTaskText('');
    setDueDate(null); // Reset dueDate

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

 const isOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false;
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  return due <= now; 
};

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleDone = (index: number) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
    saveTasks(updated); // Save changes
  };

  const deleteDoneTasks = () => {
    const remaining = tasks.filter(t => !t.done);
    setTasks(remaining);
    saveTasks(remaining); // Save updated list
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>My Task List</Text>

        <TextInput
          style={styles.input}
          placeholder="Add Task"
          value={newTaskText}
          onChangeText={setNewTaskText}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.fixedButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.buttonText}>Due Date</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fixedButton, { backgroundColor: '#1c9de7' }]}
            onPress={handleAddTask}
          >
            <Text style={styles.buttonText}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fixedButton, { backgroundColor: '#FF5555' }]}
            onPress={deleteDoneTasks}
          >
            <Text style={styles.buttonText}>Remove Done</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDueDate(new Date(selectedDate));
                setShowTimePicker(true);
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime && dueDate) {
                const updatedDate = new Date(dueDate);
                updatedDate.setHours(selectedTime.getHours());
                updatedDate.setMinutes(selectedTime.getMinutes());
                setDueDate(updatedDate);
              }
            }}
          />
        )}

        {tasks.map((item, index) => (
          <View
            key={index}
            style={[styles.taskRow, { opacity: item.done ? 0.3 : 1 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.taskText}>
                {index + 1}. {item.text}
              </Text>
              <Text
                style={[
                  styles.taskDate,
                  isOverdue(item.dueDate) && !item.done ? { color: 'red' } : {},
                ]}
              >
                Due: {formatDate(item.dueDate)}
              </Text>
            </View>

            {!item.done && (
              <TouchableOpacity
                style={[
                  styles.fixedButton,
                  {
                    backgroundColor:
                      isOverdue(item.dueDate) && !item.done ? 'red' : 'green',
                    borderColor:
                      isOverdue(item.dueDate) && !item.done
                        ? 'darkred'
                        : 'transparent',
                    borderWidth: 2,
                  },
                ]}
                onPress={() => toggleDone(index)}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MyApp;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  fixedButton: {
    width: 110,
    height: 35,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  taskText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 10,
    color: '#000000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 5,
    flexWrap: 'wrap',
  },
});

