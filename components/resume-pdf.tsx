"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { ResumeData } from "@/lib/resume-context";

// Register fonts (using built-in fonts for now, can add custom fonts later)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2" },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center",
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    fontSize: 9,
    color: "#4b5563",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  separator: {
    color: "#9ca3af",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
    marginBottom: 6,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#374151",
  },
  experienceItem: {
    marginBottom: 8,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  experienceTitle: {
    fontSize: 10,
    fontWeight: "bold",
  },
  experienceCompany: {
    fontSize: 9,
    color: "#4b5563",
    marginTop: 1,
  },
  experienceDate: {
    fontSize: 9,
    color: "#6b7280",
  },
  bulletList: {
    marginTop: 4,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: "row",
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  bullet: {
    width: 8,
    color: "#9ca3af",
  },
  bulletText: {
    flex: 1,
    color: "#374151",
  },
  educationItem: {
    marginBottom: 6,
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  educationInstitution: {
    fontSize: 10,
    fontWeight: "bold",
  },
  educationDegree: {
    fontSize: 9,
    color: "#4b5563",
    marginTop: 1,
  },
  educationDate: {
    fontSize: 9,
    color: "#6b7280",
  },
  skillsContainer: {
    flexDirection: "column",
    gap: 4,
  },
  skillRow: {
    flexDirection: "row",
    fontSize: 9,
  },
  skillLabel: {
    fontWeight: "bold",
    width: 80,
  },
  skillValue: {
    flex: 1,
    color: "#374151",
  },
  projectItem: {
    marginBottom: 6,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  projectName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  projectUrl: {
    fontSize: 8,
    color: "#2563eb",
  },
  projectTech: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#6b7280",
    marginTop: 1,
  },
  projectDesc: {
    fontSize: 9,
    color: "#374151",
    marginTop: 2,
  },
  certItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  certName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  certIssuer: {
    fontSize: 9,
    color: "#4b5563",
  },
  certDate: {
    fontSize: 9,
    color: "#6b7280",
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function ResumePDF({ data }: ResumePDFProps) {
  const { personalInfo, experience, education, skills, projects, certifications } = data;

  const formatUrl = (url: string) => {
    return url.replace(/^https?:\/\//, "");
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {personalInfo.fullName && (
            <Text style={styles.name}>{personalInfo.fullName}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && (
              <View style={styles.contactItem}>
                <Text>{personalInfo.email}</Text>
              </View>
            )}
            {personalInfo.email && personalInfo.phone && (
              <Text style={styles.separator}>|</Text>
            )}
            {personalInfo.phone && (
              <View style={styles.contactItem}>
                <Text>{personalInfo.phone}</Text>
              </View>
            )}
            {(personalInfo.email || personalInfo.phone) && personalInfo.location && (
              <Text style={styles.separator}>|</Text>
            )}
            {personalInfo.location && (
              <View style={styles.contactItem}>
                <Text>{personalInfo.location}</Text>
              </View>
            )}
          </View>
          <View style={styles.contactRow}>
            {personalInfo.website && (
              <View style={styles.contactItem}>
                <Text>{formatUrl(personalInfo.website)}</Text>
              </View>
            )}
            {personalInfo.website && personalInfo.linkedin && (
              <Text style={styles.separator}>|</Text>
            )}
            {personalInfo.linkedin && (
              <View style={styles.contactItem}>
                <Text>{formatUrl(personalInfo.linkedin)}</Text>
              </View>
            )}
            {(personalInfo.website || personalInfo.linkedin) && personalInfo.github && (
              <Text style={styles.separator}>|</Text>
            )}
            {personalInfo.github && (
              <View style={styles.contactItem}>
                <Text>{formatUrl(personalInfo.github)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{personalInfo.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View>
                    <Text style={styles.experienceTitle}>{exp.position || "Position"}</Text>
                    <Text style={styles.experienceCompany}>{exp.company || "Company"}</Text>
                  </View>
                  <Text style={styles.experienceDate}>
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </Text>
                </View>
                {exp.bullets && (
                  <View style={styles.bulletList}>
                    {exp.bullets.split("\n").filter(Boolean).map((bullet, i) => (
                      <View key={i} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                          {bullet.replace(/^[•\-\*]\s*/, "")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <View>
                    <Text style={styles.educationInstitution}>{edu.institution || "Institution"}</Text>
                    <Text style={styles.educationDegree}>
                      {edu.degree || "Degree"}
                      {edu.field ? ` in ${edu.field}` : ""}
                      {edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
                    </Text>
                  </View>
                  {edu.graduationDate && (
                    <Text style={styles.educationDate}>{edu.graduationDate}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {(skills.technical || skills.frameworks || skills.tools) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.technical && (
                <View style={styles.skillRow}>
                  <Text style={styles.skillLabel}>Technical:</Text>
                  <Text style={styles.skillValue}>{skills.technical}</Text>
                </View>
              )}
              {skills.frameworks && (
                <View style={styles.skillRow}>
                  <Text style={styles.skillLabel}>Frameworks:</Text>
                  <Text style={styles.skillValue}>{skills.frameworks}</Text>
                </View>
              )}
              {skills.tools && (
                <View style={styles.skillRow}>
                  <Text style={styles.skillLabel}>Tools:</Text>
                  <Text style={styles.skillValue}>{skills.tools}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.projectItem}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{proj.name || "Project Name"}</Text>
                  {proj.url && (
                    <Text style={styles.projectUrl}>{formatUrl(proj.url)}</Text>
                  )}
                </View>
                {proj.technologies && (
                  <Text style={styles.projectTech}>{proj.technologies}</Text>
                )}
                {proj.description && (
                  <Text style={styles.projectDesc}>{proj.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <View>
                  <Text style={styles.certName}>{cert.name || "Certification"}</Text>
                  <Text style={styles.certIssuer}>{cert.issuer || "Issuer"}</Text>
                </View>
                {cert.date && (
                  <Text style={styles.certDate}>{cert.date}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}