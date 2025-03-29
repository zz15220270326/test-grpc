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
