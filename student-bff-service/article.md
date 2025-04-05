---
title: 基于 BFF + GRPC 实现数据聚合的功能
date: 2024-08-15 14:48:51
tags:
- BFF
- GRPC
categories:
- 微服务
- BFF
- GRPC
---

## 什么是 BFF？

BFF 即 Backend For Frontend（服务于前端的后端），是一种为特定前端应用量身定制后端服务的架构模式。该模式由 Sam Newman 在 2015 年提出，其核心思想是针对不同的前端设备（如 Web、移动端等）或前端应用（如不同业务线的前端应用）创建独立的后端服务，以更好地满足各前端的特定需求。

## 为什么下游的接口需要使用 GRPC?

在 BFF（Backend for Frontend）架构里，下游服务端接口选用 gRPC 有以下几个关键原因：

### 1. 高性能

-   **二进制协议**：gRPC 采用 Protocol Buffers 这种二进制序列化协议，相较于 JSON 等文本格式，它在数据序列化和反序列化时速度更快，且占用的带宽更少。这能显著提升数据传输效率，尤其适用于处理大量数据或者对响应时间要求严苛的场景。
-   **HTTP/2 协议**：gRPC 基于 HTTP/2 协议，该协议具备多路复用、头部压缩等特性，能够有效减少网络延迟，提高传输性能。多路复用允许在一个连接上并行处理多个请求和响应，避免了传统 HTTP/1.1 协议中的队头阻塞问题。

### 2. 强类型接口定义

-   **Protocol Buffers 定义**：借助 Protocol Buffers 可以精准定义服务接口和消息结构，这有助于在开发过程中进行类型检查，降低因类型不匹配引发的错误。同时，明确的接口定义也方便团队成员之间的沟通与协作。
-   **代码生成**：gRPC 可以依据 `.proto` 文件自动生成客户端和服务端的代码，极大地提升了开发效率，减少了手动编写样板代码的工作量。

### 3. 多语言支持

-   **跨语言兼容性**：gRPC 支持多种编程语言，如 Python、Java、Go、JavaScript 等。这使得在构建复杂的分布式系统时，不同团队可以根据自身需求选用合适的编程语言进行开发，同时保证各个服务之间能够无缝通信。

### 4. 流式传输

-   **双向流式传输**：gRPC 支持双向流式传输，即客户端和服务端可以同时发送和接收多个消息，这在实时数据处理、大数据传输等场景中非常有用。例如，在实时监控系统中，服务端可以持续向客户端推送最新的监控数据。

### 5. 易于维护和扩展

-   **服务发现和负载均衡**：gRPC 与常见的服务发现工具（如 Consul、Etcd）和负载均衡器（如 Envoy）集成良好，方便实现服务的自动发现和负载均衡，提高系统的可维护性和扩展性。
-   **版本管理**：Protocol Buffers 支持向后和向前兼容，这意味着在对服务接口进行升级时，不需要对现有客户端进行大规模的修改，降低了系统升级的成本和风险。

  


本文是一次下游结合 BFF 请求的实践，其中：

1. 下游接口使用 SpringBoot

2. BFF 接口使用 Node.js (Express 框架)

  


--------------------------------------------------------------------------------------------

  


# 需求描述：

有三个学生信息表，分别由三个 grpc 接口返回, protobuf 定义如下：

```protobuf
syntax = "proto3";

package student;

// 是否需要打包成多个 java 文件 (这里填 true)
option java_multiple_files = true;
// 最终输出的项目包，这里需要指定在扫描包下的 api 子包里面
option java_package = "cn.bklovezz.api.grpc";
// 定义向外暴露的 class 名称, 这里就先给一个 "StudentProto"
option java_outer_classname = "StudentProto";

service StudentService {
  rpc getStudentInfoList (GetStudentInfoListRequest) returns (GetStudentInfoListResponse) {}

  rpc getStudentScoreList (GetStudentScoreInfoRequest) returns (GetStudentScoreInfoResponse) {};

  rpc getStudentAttendList (GetStudentAttendInfoRequest) returns (GetStudentAttendInfoResponse) {};
}

message GetStudentInfoListRequest {
  optional string name = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentInfoListResponse {
  int64 total = 1;
  repeated StudentInfo list = 2;
}

message GetStudentScoreInfoRequest {
  repeated int32 studentIds = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentScoreInfoResponse {
  int64 total = 1;
  repeated StudentScoreInfo list = 2;
}

message GetStudentAttendInfoRequest {
  repeated int32 studentIds = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentAttendInfoResponse {
  int64 total = 1;
  repeated StudentAttendInfo list = 2;
}

message StudentInfo {
  int64 id = 1;
  string name = 2;
  int32 age = 3;
  optional sint32 gender = 4;
}

message StudentScoreInfo {
  int64 studentId = 1;
  double chineseScore = 2;
  double mathScore = 3;
  double englishScore = 4;
}

message StudentAttendInfo {
  int64 studentId = 1;
  int64 attendDays = 2;
}
```

要求：使用 bff 整合三个接口的数据并返回给前端：

## 成功示例：

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "student1",
      "age": 18,
      "gender": 1,
      "gradeInfo": {
        "chineseGrade": 80,
        "mathGrade": 85,
        "englishGrade": 90
      },
      "attendInfo": {
        "attendDays": 100
      }
    }
  ]
}
```

## 失败示例：

```json
{
  "code": "${errorCode}",
  "message": "Error",
  "data": null,
  "reason": "${reason}"
}
```

# 项目架构：

```sh
|_ grpc_api		# maven 关联模块
  |_ src		# 项目源码
    |_ main
      |_ proto # 所有的接口定义
        |_ Student.proto # 这里是我们需要用到的接口定义
  |_ target # 编译输出目录

|_ invoke_grpc_service	# springboot + netty 服务
  |_ src		# 项目源码
    |_ main # 项目源代码
      |_ java
        |_ ...
          |_ domain							# 所有的实体类定义
          |_ mapper							# MabatisMapper 定义
          |_ service							# 项目 service 定义
            |_ impl
              |_ StudentServiceImpl
          |_ BootstrapApplication # 启动类
      |_ resources
    |_ test # 单元测试
  |_ target # 编译输出目录

|_ bff-service 		# node 服务器 (简单点，基于 express)
  |_ client
    |_ GrpcClient	# 调用 Grpc 的服务端类声明
  |_ config
    |_ api.js # API 定义的文件
  |_ controller
    |_ StudentController
  |_ middleware
    |_ CrossOrigin
  |_ public
    |_ js
      |_ ...
    |_ css
      |_ ...
  |_ router
    |_ main.js
    |_ student.js
  |_ util
    |_ BaseDTO.js
    |_ GrpcClient.js
  |_ views
    |_ ...
    |_ index.ejs
  |_ proto
    |_ Student.proto # 这里是我们需要用到的接口定义 (和上面的保持一致)
  |_ app.js # 程序入口
```

# 实现：

## Api 实现：

1.  在 `pom.xml` 的 properties 中定义常量，并引入 maven 依赖

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>cn.bklove-zz.api</groupId>
        <artifactId>test-grpc</artifactId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <artifactId>grpc-api</artifactId>
    <name>Archetype - grpc-api</name>
    <url>http://maven.apache.org</url>

    <properties>
        <java.version>11</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>2.6.13</spring-boot.version>

        <!-- 定义版本 -->
        <protobuf.version>3.21.7</protobuf.version>
        <protobuf-plugin.version>0.6.1</protobuf-plugin.version>
        <grpc.version>1.52.1</grpc.version>
    </properties>

    <dependencies>
        <!-- 定义 grpc 依赖 -->
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-stub</artifactId>
            <version>${grpc.version}</version>
        </dependency>
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-protobuf</artifactId>
            <version>${grpc.version}</version>
        </dependency>
        <dependency>
            <!-- Java 9+ compatibility - Do NOT update to 2.0.0 -->
            <groupId>jakarta.annotation</groupId>
            <artifactId>jakarta.annotation-api</artifactId>
            <version>1.3.5</version>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-bom</artifactId>
            <version>${grpc.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>

    <build>
        <extensions>
            <!-- grpc os 配套依赖 -->
            <extension>
                <groupId>kr.motd.maven</groupId>
                <artifactId>os-maven-plugin</artifactId>
                <version>1.7.0</version>
            </extension>
        </extensions>
        <plugins>
            <!-- grpc 编译 -->
            <plugin>
                <groupId>org.xolstice.maven.plugins</groupId>
                <artifactId>protobuf-maven-plugin</artifactId>
                <version>${protobuf-plugin.version}</version>
                <configuration>
                    <protocArtifact>com.google.protobuf:protoc:${protobuf.version}:exe:${os.detected.classifier}</protocArtifact>
                    <pluginId>grpc-java</pluginId>
                    <pluginArtifact>io.grpc:protoc-gen-grpc-java:${grpc.version}:exe:${os.detected.classifier}</pluginArtifact>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>compile</goal>
                            <goal>compile-custom</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

2. 在 `src/main/proto` 文件夹（如果没有则需要依次创建）中定义 proto 文件

```protobuf
syntax = "proto3";

package student;

// 是否需要打包成多个 java 文件 (这里填 true)
option java_multiple_files = true;
// 最终输出的项目包，这里需要指定在扫描包下的 api 子包里面
option java_package = "cn.bklovezz.api.grpc";
// 定义向外暴露的 class 名称, 这里就先给一个 "StudentProto"
option java_outer_classname = "StudentProto";

service StudentService {
rpc getStudentInfoList (GetStudentInfoListRequest) returns (GetStudentInfoListResponse) {}

rpc getStudentScoreList (GetStudentScoreInfoRequest) returns (GetStudentScoreInfoResponse) {};

rpc getStudentAttendList (GetStudentAttendInfoRequest) returns (GetStudentAttendInfoResponse) {};
}

message GetStudentInfoListRequest {
  optional string name = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentInfoListResponse {
  int64 total = 1;
  repeated StudentInfo list = 2;
}

message GetStudentScoreInfoRequest {
  repeated int32 studentIds = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentScoreInfoResponse {
  int64 total = 1;
  repeated StudentScoreInfo list = 2;
}

message GetStudentAttendInfoRequest {
  repeated int32 studentIds = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentAttendInfoResponse {
  int64 total = 1;
  repeated StudentAttendInfo list = 2;
}

message StudentInfo {
  int64 id = 1;
  string name = 2;
  int32 age = 3;
  optional sint32 gender = 4;
}

message StudentScoreInfo {
  int64 studentId = 1;
  double chineseScore = 2;
  double mathScore = 3;
  double englishScore = 4;
}

message StudentAttendInfo {
  int64 studentId = 1;
  int64 attendDays = 2;
}
```

1.  使用 maven 打包模块 (`clean` + `complie`)

## Grpc 服务端实现：

### 1. 添加 maven 依赖 （grpc-server-spring-boot-starter + grpc_api）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>cn.bklove-zz.api</groupId>
    <artifactId>invoke-grpc-student-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>invoke-grpc-student-service</name>
    <description>invoke-grpc-student-service</description>
    <properties>
        <java.version>11</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>2.6.13</spring-boot.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.2.2</version>
        </dependency>

        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>cn.bklove-zz.api</groupId>
            <artifactId>grpc-api</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>
        <dependency>
            <groupId>net.devh</groupId>
            <artifactId>grpc-server-spring-boot-starter</artifactId>
            <version>2.14.0.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                    <encoding>UTF-8</encoding>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>${spring-boot.version}</version>
                <configuration>
                    <mainClass>cn.bklovezz.api.invokegrpcstudentservice.InvokeGrpcStudentServiceApplication</mainClass>
                    <skip>true</skip>
                </configuration>
                <executions>
                    <execution>
                        <id>repackage</id>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

</project>
```

### 2. 配置 application.yml (⚠️ 注意： 如果之前有 application.properties需要删掉！)

```yaml
server:
  port: 50000

# 这里一定要写！！！
grpc:
  server:
    port: 50001

spring:
  application:
    name: invoke-grpc-student-service
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test_db
    username: root
    password: 12345678
    initial-size: 5
    min-idle: 5
    max-active: 20
    max-wait: 60000

mybatis:
  mapper-locations: classpath:mappers/*xml
  type-aliases-package: cn.bklovezz.api.invokegrpcstudentservice.mybatis.entity
  global-config:
    db-config:
      id-type: auto
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

### 3. 初始化数据

1.  生成数据表

```sql
create table student_info_tb
(
    id     int auto_increment comment '学生 id'
        primary key,
    name   varchar(50) not null comment '学生姓名',
    age    int         null comment '学生年龄',
    gender tinyint     null comment '学生性别'
)
    comment '学生信息表';

create table student_score_info_tb
(
    score_id      int auto_increment comment '成绩 id'
        primary key,
    id            int    not null comment '学生id',
    chinese_score double null comment '语文成绩',
    math_score    double null comment '数学成绩',
    english_score double null comment '英语成绩'
) comment '学生成绩表';

create table student_attend_info_tb
(
    attend_id   int auto_increment comment '考勤记录 ID' primary key,
    id          int null comment '学生id',
    attend_days int null comment '出勤天数'
) COMMENT '学生出勤表';
```

1.  插入数据

```sql
INSERT INTO test_db.student_info_tb (name, age, gender) VALUES ('张三', 18, 1);
INSERT INTO test_db.student_info_tb (name, age, gender) VALUES ('李四', 19, 2);
INSERT INTO test_db.student_info_tb (name, age, gender) VALUES ('王五', 20, 2);

INSERT INTO test_db.student_score_info_tb (id, chinese_score, math_score, english_score) VALUES (1, 90, 85, 95);
INSERT INTO test_db.student_score_info_tb (id, chinese_score, math_score, english_score) VALUES (2, 80, 75, 85);
INSERT INTO test_db.student_score_info_tb (id, chinese_score, math_score, english_score) VALUES (3, 70, 65, 75);

INSERT INTO test_db.student_attend_info_tb (id, attend_days) VALUES (1, 300);
INSERT INTO test_db.student_attend_info_tb (id, attend_days) VALUES (2, 200);
INSERT INTO test_db.student_attend_info_tb (id, attend_days) VALUES (3, 500);
```

### 4. 实现 StudentServiceImpl

```java
package cn.bklovezz.api.invokegrpcstudentservice.service.impl;

import cn.bklovezz.api.grpc.*;
import cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentAttendPO;
import cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentInfoPO;
import cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentScorePO;
import cn.bklovezz.api.invokegrpcstudentservice.mapper.StudentMapper;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class StudentServiceImpl extends StudentServiceGrpc.StudentServiceImplBase {
    private final StudentMapper studentMapper;

    @Transactional
    @Override
    public void getStudentInfoList(
            GetStudentInfoListRequest request,
            StreamObserver<GetStudentInfoListResponse> responseObserver
    ) {
        int pageNum = request.getPageNum() <= 0 ? 1 : request.getPageNum();
        int pageSize = request.getPageSize() <= 0 ? 10 : request.getPageSize();

        GetStudentInfoListResponse.Builder builder = GetStudentInfoListResponse.newBuilder();

        Long studentInfoTotal = studentMapper.getStudentInfoTotal(request.getName());
        List<StudentInfoPO> studentInfoList = studentMapper.getStudentInfoList(
                (pageNum - 1) * pageSize,
                pageSize,
                request.getName()
        );

        builder.setTotal(studentInfoTotal);

        studentInfoList.forEach(s -> {
            StudentInfo.Builder studentInfoBuilder = StudentInfo.newBuilder();
            studentInfoBuilder.setId(s.getId());
            studentInfoBuilder.setName(s.getName());
            studentInfoBuilder.setAge(s.getAge());
            studentInfoBuilder.setGender(s.getGender());
            builder.addList(studentInfoBuilder.build());
        });

        responseObserver.onNext(
                builder.build()
        );
        responseObserver.onCompleted();
    }

    @Transactional
    @Override
    public void getStudentScoreList(
            GetStudentScoreInfoRequest request,
            StreamObserver<GetStudentScoreInfoResponse> responseObserver
    ) {
        int pageNum = request.getPageNum() <= 0 ? 1 : request.getPageNum();
        int pageSize = request.getPageSize() <= 0 ? 10 : request.getPageSize();

        Long studentScoreTotal = studentMapper.getStudentScoreTotal();
        List<StudentScorePO> studentScoreList = studentMapper.getStudentScoreList(
                (pageNum - 1) * pageSize,
                pageSize,
                request.getStudentIdsList()
        );

        GetStudentScoreInfoResponse.Builder builder = GetStudentScoreInfoResponse.newBuilder();
        builder.setTotal(studentScoreTotal);

        studentScoreList.forEach(s -> {
            StudentScoreInfo.Builder studentScoreBuilder = StudentScoreInfo.newBuilder();
            studentScoreBuilder.setStudentId(s.getId());
            studentScoreBuilder.setChineseScore(s.getChineseScore());
            studentScoreBuilder.setMathScore(s.getMathScore());
            studentScoreBuilder.setEnglishScore(s.getEnglishScore());
            builder.addList(studentScoreBuilder.build());
        });

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void getStudentAttendList(
            GetStudentAttendInfoRequest request,
            StreamObserver<GetStudentAttendInfoResponse> responseObserver
    ) {
        int pageNum = request.getPageNum() <= 0 ? 1 : request.getPageNum();
        int pageSize = request.getPageSize() <= 0 ? 10 : request.getPageSize();

        log.info("getStudentIdsList -> {}", request.getStudentIdsList());

        Long studentAttendTotal = studentMapper.getStudentAttendTotal();
        List<StudentAttendPO> studentAttendList = studentMapper.getStudentAttendList(
                (pageNum - 1) * pageSize,
                pageSize,
                request.getStudentIdsList()
        );

        GetStudentAttendInfoResponse.Builder builder = GetStudentAttendInfoResponse.newBuilder();

        builder.setTotal(studentAttendTotal);

        studentAttendList.forEach(s -> {
            StudentAttendInfo.Builder studentAttendBuilder = StudentAttendInfo.newBuilder();
            studentAttendBuilder.setStudentId(s.getId());
            studentAttendBuilder.setAttendDays(s.getAttendDays());
            builder.addList(studentAttendBuilder.build());
        });

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }
}
```

### 5. 定义实体：

```java
package cn.bklovezz.api.invokegrpcstudentservice.domain.po;

import lombok.Data;

@Data
public class StudentInfoPO {
    private Long id;

    private String name;

    private Integer age;

    private Short gender;
}

@Data
public class StudentAttendPO {
    private Long attendId;

    private Long id;

    private Long attendDays;
}

@Data
public class StudentScorePO {
    private Long scoreId;

    private Long id;

    private Double chineseScore;

    private Double mathScore;

    private Double englishScore;
}
```

### 6. 定义 Mapper 接口 以及 SQL 实现

```java
package cn.bklovezz.api.invokegrpcstudentservice.mapper;

@Mapper
public interface StudentMapper {
    public abstract Long getStudentInfoTotal(@Param("name") String name);

    public abstract List<StudentInfoPO> getStudentInfoList(
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("name") String name
    );

    public abstract Long getStudentScoreTotal();

    public abstract List<StudentScorePO> getStudentScoreList(
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("ids") List<Integer> ids
    );

    public abstract Long getStudentAttendTotal();

    public abstract List<StudentAttendPO> getStudentAttendList(
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("ids") List<Integer> ids
    );
}
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="cn.bklovezz.api.invokegrpcstudentservice.mapper.StudentMapper">
    <select id="getStudentInfoTotal" resultType="long">
        SELECT COUNT(*) from student_info_tb
            <where>
                <if test="name != null and name != ''">
                    name like CONCAT('%', #{name}, '%')
                </if>
            </where>
    </select>

    <select
            id="getStudentInfoList"
            resultType="cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentInfoPO"
    >
        SELECT id, name, age, gender FROM student_info_tb
        <where>
            <if test="name != null and name != ''">
                name like CONCAT('%', #{name}, '%')
            </if>
        </where>
        LIMIT #{limit} OFFSET #{offset}
    </select>

    <select id="getStudentScoreTotal" resultType="long">
        SELECT COUNT(*) from student_score_info_tb;
    </select>

    <select
            id="getStudentScoreList"
            resultType="cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentScorePO"
    >
        SELECT id, score_id, chinese_score, math_score, english_score FROM student_score_info_tb
        <where>
            <if test="ids != null and ids.size() > 0">
                id IN <foreach collection="ids" item="id" open="(" separator="," close=")">
                    #{id}
                </foreach>
            </if>
        </where>
        LIMIT #{limit} OFFSET #{offset}
    </select>

    <select id="getStudentAttendTotal" resultType="long">
        SELECT COUNT(*) FROM student_attend_info_tb;
    </select>

    <select id="getStudentAttendList" resultType="cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentAttendPO">
        SELECT attend_id, id, attend_days FROM student_attend_info_tb
        <where>
            <if test="ids != null and ids.size() > 0">
                id IN <foreach collection="ids" item="id" open="(" separator="," close=")">
                #{id}
            </foreach>
            </if>
        </where>
        LIMIT #{limit} OFFSET #{offset}
    </select>
</mapper>
```

## Node 服务端实现：

### 1. 初始化环境

```sh
mkdir student-bff-service

cd student-bff-service

npm init -y
```

### 2. 安装依赖

```sh
# 安装 express
npm install --save express

# 安装模版引擎
npm install --save ejs

# 安装 grpc 依赖
npm install --save @grpc/grpc-js @grpc/proto-loader

# 全局安装 nodemon
npm install --global nodemon
```

### 3. 设置启动脚本

1.  设置命令

```json
{
  "script": {
    "dev": "nodemon app.js"
  }
}
```

1.  简要编写一下启动入口 `app.js`

```js
const express = require('express');

const app = express();

app.use(async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  await next();
});

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.listen(50002, () => {
  console.log('Bff application is running on port 50002');
});
```

1.  使用 `npm run dev` 启动项目

### 4. 定义 proto/Student.proto (和上面一致)

```protobuf
syntax = "proto3";

package student;

// 是否需要打包成多个 java 文件 (这里填 true)
option java_multiple_files = true;
// 最终输出的项目包，这里需要指定在扫描包下的 api 子包里面
option java_package = "cn.bklovezz.api.grpc";
// 定义向外暴露的 class 名称, 这里就先给一个 "StudentProto"
option java_outer_classname = "StudentProto";

service StudentService {
  rpc getStudentInfoList (GetStudentInfoListRequest) returns (GetStudentInfoListResponse) {}

  rpc getStudentScoreList (GetStudentScoreInfoRequest) returns (GetStudentScoreInfoResponse) {};

  rpc getStudentAttendList (GetStudentAttendInfoRequest) returns (GetStudentAttendInfoResponse) {};
}

message GetStudentInfoListRequest {
  optional string name = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentInfoListResponse {
  int64 total = 1;
  repeated StudentInfo list = 2;
}

message GetStudentScoreInfoRequest {
  repeated int32 studentIds = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentScoreInfoResponse {
  int64 total = 1;
  repeated StudentScoreInfo list = 2;
}

message GetStudentAttendInfoRequest {
  repeated int32 studentIds = 1;
  optional int32 pageNum = 2;
  optional int32 pageSize = 3;
}

message GetStudentAttendInfoResponse {
  int64 total = 1;
  repeated StudentAttendInfo list = 2;
}

message StudentInfo {
  int64 id = 1;
  string name = 2;
  int32 age = 3;
  optional sint32 gender = 4;
}

message StudentScoreInfo {
  int64 studentId = 1;
  double chineseScore = 2;
  double mathScore = 3;
  double englishScore = 4;
}

message StudentAttendInfo {
  int64 studentId = 1;
  int64 attendDays = 2;
}
```

### 5. 封装统一的响应体输出工具 BaseDTO (如果不需要可以忽略掉这一步)

```js
class BaseDTO {
  static success(data) {
    return {
      code: 0,
      data,
      msg: 'success',
    };
  }

  static error(msg, code = -1) {
    return {
      code,
      data: null,
      msg,
    };
  }
}

module.exports = BaseDTO;
```

### 6. 封装 GrpcClient

这里封装了一个 GrpcClient 的工具类，具体的思路是这样的：

1.  根据 proto 文件定义 `packageDefination`
1.  使用 `loadPackageDefinition` 加载 `packageDefination`对应的 `proto`
1.  实例化 `proto`对应的 Service (比如说 `StudentService`)
1.  调用 `proto`下的 grpc 方法，并在回调的第二个参数 `result` (因为 nodejs 的回调默认是错误优先的) 拿到返回的结果

```js
const { loadPackageDefinition, credentials } = require('@grpc/grpc-js');
const { loadSync } = require('@grpc/proto-loader');

class ProtoClient {
  constructor(opts) {
    this.protoFilePath = opts.protoFilePath;
    this.host = opts.host;
    this.port = opts.port;
    this.packageName = opts.packageName;
    this.isShowLog = !!opts.isShowLog;
  }

  request(serviceName, methodName, params) {
    return new Promise((resolve, reject) => {
      const packageDefinition = loadSync(
        this.protoFilePath,
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      );
      const currentProto = loadPackageDefinition(packageDefinition)[this.packageName];
      const client = new currentProto[serviceName](
        `${this.host}:${this.port}`,
        credentials.createInsecure(),
      );
      if (client[methodName]) {
        client[methodName](params, (err, response) => {
          if (this.isShowLog) {
            console.dir({
              req: params,
              resp: { err, response }
            }, { depth: 5 });
          }

          if (err) {
            reject(err);
          }
          resolve(response);
        })
      }
    });
  }
}

module.exports = ProtoClient;
```

### 7. 封装请求层

1.  定义请求 API

```js
const { resolve } = require('path');

const BASE_URL = 'localhost';

const StudentApi = {
  host: BASE_URL,
  port: 50001,
  protoFilePath: resolve(__dirname, '../proto/Student.proto'),
  packageName: 'student',

  api: {
    GetStudentInfoList: {
      serviceName: 'StudentService',
      methodName: 'getStudentInfoList',
      defaultParams: {
        pageNum: 1,
        pageSize: 10,
        name: '',
      },
    },

    GetStudentScoreList: {
      serviceName: 'StudentService',
      methodName: 'getStudentScoreList',
      defaultParams: {
        pageNum: 1,
        pageSize: 10,
        // id: 0,
      },
    },

    GetStudentAttendList: {
      serviceName: 'StudentService',
      methodName: 'getStudentAttendList',
      defaultParams: {
        pageNum: 1,
        pageSize: 10,
        // id: 0,
      },
    },
  },
};

module.exports = {
  StudentApi,
};
```

1.  根据客户端请求 & 配置封装请求方法集

```js
const { StudentApi } = require('../config/api');
const GrpcClient = require('../util/GrpcClient');

const studentGrpcClient = new GrpcClient({
  host: StudentApi.host,
  port: StudentApi.port,
  packageName: StudentApi.packageName,
  protoFilePath: StudentApi.protoFilePath,
  isShowLog: true,
});

const studentApi = StudentApi.api;

async function getStudentInfoList(params = {
  pageNum: 1,
  pageSize: 10,
  name: '',
}) {
  try {
    const data = await studentGrpcClient.request(
      studentApi.GetStudentInfoList.serviceName,
      studentApi.GetStudentInfoList.methodName,
      {
        ...studentApi.GetStudentInfoList.defaultParams,
        ...params,
      },
    );
    return data;
  } catch (e) {
    return null;
  }
}

async function getStudentScoreList(params = {
  pageNum: 1,
  pageSize: 10,
  studentIds: [],
}) {
  try {
    const data = await studentGrpcClient.request(
      studentApi.GetStudentScoreList.serviceName,
      studentApi.GetStudentScoreList.methodName,
      {
       ...studentApi.GetStudentScoreList.defaultParams,
       ...params,
      },
    );
    return data;
  } catch (e) {
    return null;
  }
}

async function getStudentAttendList(params = {
  pageNum: 1,
  pageSize: 10,
  studentIds: [],
}) {
  try {
    const data = await studentGrpcClient.request(
      studentApi.GetStudentAttendList.serviceName,
      studentApi.GetStudentAttendList.methodName,
      {
      ...studentApi.GetStudentAttendList.defaultParams,
      ...params,
      },
    );
    return data;
  } catch (e) {
    return null;
  }
}

module.exports = {
  getStudentInfoList,
  getStudentScoreList,
  getStudentAttendList,
};
```

到这一步，我们的基本请求方法都已经定义完成了

### 8. 封装控制器层

1.  定义接口控制器

```js
const studentClient = require('../client/student');
const BaseDTO = require('../util/BaseDTO');

exports.getInfoList = async (req, res) => {
  try {
    const pageNum = req.query.pageNum ? Number(req.query.pageNum) : 1;
    const pageSize = req.query.pageSize? Number(req.query.pageSize) : 10;
    const name = req.query.name? String(req.query.name) : '';

    const studentInfoList = await studentClient.getStudentInfoList({
      pageNum,
      pageSize,
      name,
    });

    const studentIds = studentInfoList.list.map((item) => Number(item.id));

    const studentScoreInfoList = await studentClient.getStudentScoreList({
      pageNum: 1,
      pageSize: 500,
      studentIds,
    });
    const studentAttendInfoList = await studentClient.getStudentAttendList({
      pageNum: 1,
      pageSize: 500,
      studentIds,
    });

    // 聚合数据
    studentInfoList.list.forEach((item) => {
      item.scoreInfo = studentScoreInfoList.list.find((scoreItem) => scoreItem.studentId == item.id);
      if (item.scoreInfo.studentId) {
        delete item.scoreInfo.studentId;
      }

      item.attendInfo = studentAttendInfoList.list.find((attendItem) => attendItem.studentId == item.id);
      if (item.attendInfo.studentId) {
        delete item.attendInfo.studentId;
      }
    });

    res.status(200).json(BaseDTO.success(studentInfoList));
  } catch (e) {
    res.status(405).json(BaseDTO.error(e?.message ?? e));
  }
}
```

2.  定义渲染控制器

```js
exports.getIndexPage = (req, res) => {
  res.render('index', {});
};
```

### 9. 封装路由

1. 定义接口路由

```js
const { Router } = require('express');

const studentController = require('../controller/student');

const StudentRouter = Router();

StudentRouter.get('/info', studentController.getInfoList);

module.exports = StudentRouter;
```

2.  定义渲染路由

```js
const { Router } = require('express');
const mainController = require('../controller/main');

const main = Router();

main.get('/', mainController.getIndexPage);

module.exports = main;
```

### 10. 入口注册路由

```diff
+ app.use('/', require('./router/main'));
+ app.use('/student', require('./router/student'));
```

## 前端调用：

基于 axios 封装方法调用 (以 Axios 举例)

```js
import Axios from 'axios';

Axios({
  method: 'GET',
  url: '/api/student/info',
})
  .then(res => console.log(res.data))
  .catch(err => console.warn(err));
```

# 参考：

<https://github.com/zz15220270326/test-grpc/>