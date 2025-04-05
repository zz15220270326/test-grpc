package cn.bklovezz.api.invokegrpcstudentclient.client;

import cn.bklovezz.api.grpc.GetStudentInfoListRequest;
import cn.bklovezz.api.grpc.GetStudentInfoListResponse;
import cn.bklovezz.api.grpc.StudentInfo;
import cn.bklovezz.api.grpc.StudentServiceGrpc;
import cn.bklovezz.api.invokegrpcstudentclient.domain.vo.PaginationList;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class StudentClient {
    @GrpcClient("student-service")
    private StudentServiceGrpc.StudentServiceBlockingStub studentServiceBlockingStub;
    
    public PaginationList<StudentInfo> getStudentInfoList(Integer pageNum, Integer pageSize, String name) {
        log.info("pageNum: {}, pageSize: {}, name: {}", pageNum, pageSize, name);
        GetStudentInfoListRequest request = GetStudentInfoListRequest.newBuilder()
                .setPageNum(pageNum == null ? 1 : pageNum)
                .setPageSize(pageSize == null ? 10 : pageSize)
                .setName(name == null ? "" : name)
                .build();
        GetStudentInfoListResponse result = studentServiceBlockingStub.getStudentInfoList(request);
        long total = result.getTotal();
        List<StudentInfo> studentInfoList = result.getListList();

        log.info("total: {}, studentInfoList: {}", total, studentInfoList);

        return new PaginationList<>(total, studentInfoList);
    }
}
