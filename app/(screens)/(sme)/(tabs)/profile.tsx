// app/(tabs)/profile.tsx (SME Profile)

import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import MainContainer from "@/components/MainContainer";
import FadeIn from "@/components/common/FadeIn";

// ─── Mock SME Data ─────────────────────────────
const MOCK_SME = {
    id: "sme_1",
    name: "GreenTech Innovations",
    logo: null,
    verified: true,
    location: "Kumasi, Ghana",
    description:
        "Sustainable technology solutions for African SMEs. We develop solar-powered devices and eco-friendly electronics.",
    email: "hello@greentech.com",
    phone: "+254 700 123 456",
    website: "www.greentech.com",
    memberSince: "Jan 2023",
};

export default function SMEProfileScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? "light"];

    const [profile, setProfile] = useState(MOCK_SME);
    const [edited, setEdited] = useState(MOCK_SME);
    const [editing, setEditing] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEdited({
                ...edited,
                logo: result.assets[0].uri,
            });
        }
    };

    const save = () => {
        setProfile(edited);
        setEditing(false);
    };

    const cancel = () => {
        setEdited(profile);
        setEditing(false);
    };

    const data = editing ? edited : profile;

    return (
        <MainContainer safe>


            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ───────── HERO ───────── */}
                <FadeIn>
                    <View style={[styles.hero, { backgroundColor: theme.cardBackground }]}>


                        {/* ───────── ACTIONS ───────── */}
                        <View style={styles.actions}>
                            {!editing ? (
                                <TouchableOpacity
                                    style={[styles.editBtn, { backgroundColor: theme.iconBackground }]}
                                    onPress={() => setEditing(true)}
                                >
                                    <Ionicons name="create-outline" size={18} color={theme.icon} />
                                </TouchableOpacity>
                            ) : (
                                <View style={{ flexDirection: "row", gap: 12 }}>
                                    <TouchableOpacity onPress={cancel}>
                                        <Text style={{ color: theme.text }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={save}
                                        style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                                    >
                                        <Text style={{ color: theme.text, fontWeight: "600" }}>
                                            Save
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={editing ? pickImage : undefined}
                            activeOpacity={0.8}
                        >
                            {data.logo ? (
                                <Image source={{ uri: data.logo }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarFallback, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.avatarText}>
                                        {data.name
                                            .split(" ")
                                            .map(n => n[0])
                                            .join("")
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            {editing && (
                                <View style={styles.cameraBadge}>
                                    <Ionicons name="camera" size={14} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={{ marginTop: 12, alignItems: "center" }}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.name, { color: theme.text }]}>
                                    {data.name}
                                </Text>

                                {data.verified && (
                                    <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                                )}
                            </View>

                            <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center",}}>
                                <Ionicons name='location-outline' size={14} color={theme.icon}/>
                                <Text style={{ color: theme.textSecondary }}>
                                    {data.location}
                                </Text>
                            </View>
                        </View>


                    </View>


                </FadeIn>

                {/*/!* ───────── ABOUT ───────── *!/*/}
                {/*<FadeIn delay={80}>*/}
                {/*    <View style={styles.section}>*/}
                {/*        <Text style={[styles.sectionTitle, { color: theme.text }]}>*/}
                {/*            About Company*/}
                {/*        </Text>*/}

                {/*        {editing ? (*/}
                {/*            <TextInput*/}
                {/*                value={edited.description}*/}
                {/*                onChangeText={(t) =>*/}
                {/*                    setEdited({ ...edited, description: t })*/}
                {/*                }*/}
                {/*                multiline*/}
                {/*                style={[*/}
                {/*                    styles.input,*/}
                {/*                    {*/}
                {/*                        borderColor: theme.border,*/}
                {/*                        color: theme.text,*/}
                {/*                    },*/}
                {/*                ]}*/}
                {/*            />*/}
                {/*        ) : (*/}
                {/*            <Text style={{ color: theme.textSecondary, lineHeight: 20 }}>*/}
                {/*                {profile.description}*/}
                {/*            </Text>*/}
                {/*        )}*/}
                {/*    </View>*/}
                {/*</FadeIn>*/}

                {/* ───────── CONTACT (PROFESSIONAL ROWS) ───────── */}
                <FadeIn delay={140}>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Contact Information
                        </Text>

                        <ContactRow
                            icon="mail-outline"
                            label="Email"
                            value={profile.email}
                            theme={theme}
                        />

                        <ContactRow
                            icon="call-outline"
                            label="Phone"
                            value={profile.phone}
                            theme={theme}
                        />

                        <ContactRow
                            icon="globe-outline"
                            label="Website"
                            value={profile.website}
                            theme={theme}
                        />
                    </View>
                </FadeIn>

            </ScrollView>
        </MainContainer>
    );
}

/* ───────── CONTACT ROW (PROFESSIONAL UI) ───────── */

const ContactRow = ({ icon, label, value, theme }: any) => (
    <View style={[styles.contactRow, { borderBottomColor: theme.border }]}>
        <View style={styles.contactLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.iconBackground }]}>
                <Ionicons name={icon} size={20} color={theme.icon} />
            </View>

            <Text style={[styles.contactLabel, { color: theme.text }]}>
                {label}
            </Text>
        </View>

        <Text
            numberOfLines={1}
            style={[styles.contactValue, { color: theme.textSecondary }]}
        >
            {value}
        </Text>
    </View>
);

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
    hero: {
        margin: 16,
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
    },

    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },

    avatarFallback: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center",
    },

    avatarText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
    },

    cameraBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 6,
        borderRadius: 20,
    },

    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        justifyContent: "center",
    },

    name: {
        fontSize: 20,
        fontWeight: "800",
    },

    actions: {
        marginTop: 14,
        position: "absolute",
        alignSelf:"flex-end",
        marginRight:15
    },

    editBtn: {
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: "center",
    },

    saveBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },

    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
    },

    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
        textAlignVertical: "top",
    },

    /* CONTACT PROFESSIONAL ROW */
    contactRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
    },

    contactLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },

    contactLabel: {
        fontSize: 14,
        fontWeight: "600",
    },

    contactValue: {
        fontSize: 13,
        maxWidth: "60%",
        textAlign: "right",
    },
});